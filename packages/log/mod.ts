import * as log from '../../dep/std/log.ts';
import * as colors from '../../dep/std/colors.ts';
import * as murmur from '../murmur/mod.ts';

/**
 * Internal representation of a log record
 */
type FrugalLogRecord = {
    /** the log message */
    msg?: string;
    logger: {
        level: number;
        levelName: string;
        /** the scope of the logger that produced the current record */
        scope: string;
        datetime: Date;
        /** an optional property marking the start of a time interval
         * measurment */
        timerStart?: string;
        /** an optional property marking the end of a time interval measurment
         * (relative to a log record with a matching `startTime`) */
        timerEnd?: string;
        /** a property automatically filled with the result of a time interval
         * measurment (in the `timerEnd` record) */
        delta?: number;
    };
};

/**
 * Small time keeper utility
 */
class StopWatch {
    #timers: Map<string, number>;

    constructor() {
        this.#timers = new Map();
    }

    /**
     * Given a `FrugalLogRecord`, this function will :
     * - start a timer associated with the `logger.timerStart` value (if
     *   present)
     * - end the timer associated with the `logger.timerEnd` value (if present)
     *   and set the `logger.delta` value.
     */
    time(record: FrugalLogRecord) {
        if (record.logger.timerStart) {
            const timerStartKey =
                `${record.logger.scope}:${record.logger.timerStart}`;
            this.#timers.set(timerStartKey, performance.now());
        }

        if (record.logger.timerEnd) {
            const timerEndKey =
                `${record.logger.scope}:${record.logger.timerEnd}`;
            if (this.#timers.has(timerEndKey)) {
                record.logger.delta = performance.now() -
                    this.#timers.get(timerEndKey)!;
            }
        }
    }
}

/**
 * Format a `log.LogRecord` to the `FrugalLogRecord` structure.
 */
class FrugalFormatter {
    #stopwatch: StopWatch;

    constructor() {
        this.#stopwatch = new StopWatch();
    }

    format(logRecord: log.LogRecord): FrugalLogRecord {
        const data = this.#parseData(logRecord);

        const record: FrugalLogRecord = {
            ...data,
            logger: {
                ...data.logger,
                level: logRecord.level,
                levelName: logRecord.levelName,
                scope: logRecord.loggerName,
                datetime: logRecord.datetime,
            },
        };

        this.#stopwatch.time(record);

        return record;
    }

    #parseData(logRecord: log.LogRecord): Partial<FrugalLogRecord> {
        try {
            return JSON.parse(logRecord.msg);
        } catch {
            return { msg: logRecord.msg };
        }
    }
}

/**
 * A basic log handler, that format each log record passing through
 */
class FrugalHandler extends log.handlers.ConsoleHandler {
    #frugalFormatter: FrugalFormatter;

    constructor(levelName: log.LevelName, options: log.HandlerOptions = {}) {
        super(levelName, options);
        this.#frugalFormatter = new FrugalFormatter();
    }

    toFrugalRecord(logRecord: log.LogRecord): FrugalLogRecord {
        return this.#frugalFormatter.format(logRecord);
    }
}

/**
 * The JSONHandler, that flat-out stringify any `FrugalLogRecord` passing
 * through.
 */
class JSONHandler extends FrugalHandler {
    format(logRecord: log.LogRecord): string {
        return JSON.stringify(this.toFrugalRecord(logRecord));
    }
}

/**
 * The JSONHandler, that will output a human readable string for each
 * `FrugalLogRecord` passing through. Messages will be colored depending on
 * levels :
 *  - `CRITICAL` or `ERROR` level messages will be printed black on a red
 *    background
 *  - `WARNING` level messages will be printed yellow
 *  - `INFO` or `DEBUG` level messages will be printed white, with a random
 *    persistent color for each scope.
 *
 * If a `logger.delta` value is present, a string `'(done in xxx s)'` will be
 * appended to the message
 */
class HumanHandler extends FrugalHandler {
    #colors: Map<string, number>;

    constructor(levelName: log.LevelName, options: log.HandlerOptions = {}) {
        super(levelName, options);
        this.#colors = new Map();
    }

    format(logRecord: log.LogRecord): string {
        const record = this.toFrugalRecord(logRecord);

        const time =
            `${record.logger.datetime.toLocaleDateString()} ${record.logger.datetime.toLocaleTimeString()}.${record.logger.datetime.getMilliseconds()}`;
        const scope = record.logger.scope;
        const level = record.logger.levelName;

        switch (level) {
            case 'CRITICAL':
            case 'ERROR': {
                return this.#message(
                    time,
                    level,
                    scope,
                    record,
                );
            }
            case 'WARNING': {
                return colors.yellow(this.#message(time, level, scope, record));
            }
            case 'INFO':
            case 'DEBUG': {
                const coloredScope = colors.rgb8(
                    scope,
                    this.#scopeColorIndex(scope),
                );
                return this.#message(time, level, coloredScope, record);
            }
            default: {
                return this.#message(time, level, scope, record);
            }
        }
    }

    #message(
        time: string,
        level: string,
        scope: string,
        record: FrugalLogRecord,
    ): string {
        const delta = record.logger.delta !== undefined
            ? ` (done in ${record.logger.delta / 1000} s)`
            : '';

        return `[${time}|${level}|${scope}] - ${
            record.msg ?? JSON.stringify(record)
        }${delta}`;
    }

    #scopeColorIndex(scope: string): number {
        if (!this.#colors.has(scope)) {
            const hash = new murmur.Hash().update(scope).digest('raw');

            const index = (hash % Math.floor((6 * 5 * 6 - 3) / 2)) * 2 + 19;

            this.#colors.set(scope, index);
        }

        return this.#colors.get(scope)!;
    }
}

/**
 * The user log record
 */
type FrugalLogEntry = {
    msg?: string | (() => string);
    $$error?: Error;
    logger?: {
        timerStart?: string;
        timerEnd?: string;
        delta?: number;
    };
} & Record<string, unknown>;

/**
 * The logger, wrapping a `log.Logger`. This wrapper is an adapter between the
 * custom `FrugalLogEntry` structure and the `log.Logger`
 */
export class FrugalLogger {
    logger: log.Logger;

    constructor(logger: log.Logger) {
        this.logger = logger;
    }

    #log<T extends FrugalLogEntry>(
        level: 'info' | 'debug' | 'warning' | 'error' | 'critical',
        entry: T,
    ): Omit<T, 'msg'> & { msg?: string } {
        let msg = typeof entry.msg === 'function' ? entry.msg() : entry.msg;
        if (entry.$$error) {
            msg += `\n${entry.$$error.stack}`;
        }
        if (this.logger.level === 0) {
            return { ...entry, msg };
        }

        // deno-lint-ignore no-explicit-any
        return this.logger[level]<T>({ ...entry, msg } as any) as any;
    }

    debug<T extends FrugalLogEntry>(
        entry: T,
    ): Omit<T, 'msg'> & { msg?: string } {
        return this.#log('debug', entry);
    }

    info<T extends FrugalLogEntry>(
        entry: T,
    ): Omit<T, 'msg'> & { msg?: string } {
        return this.#log('info', entry);
    }

    warning<T extends FrugalLogEntry>(
        entry: T,
    ): Omit<T, 'msg'> & { msg?: string } {
        return this.#log('warning', entry);
    }

    error<T extends FrugalLogEntry>(
        entry: T,
        error?: Error,
    ): Omit<T, 'msg'> & { msg?: string } {
        return this.#log('error', {
            ...entry,
            '$$error': error,
        });
    }

    critical<T extends FrugalLogEntry>(
        entry: T,
        error?: Error,
    ): Omit<T, 'msg'> & { msg?: string } {
        return this.#log('critical', {
            ...entry,
            '$$error': error,
        });
    }
}

export type Config = {
    type?: 'human' | 'json';
    loggers: {
        [name: string]: log.LevelName;
    };
};

const DEFAULT_CONFIG: Config = {
    loggers: {
        default: 'DEBUG',
    },
};

export async function setup({ type = 'human', loggers }: Config) {
    const handlers: { [s: string]: HumanHandler | JSONHandler } = {};

    if (type === 'human') {
        handlers['human'] = new HumanHandler('DEBUG');
    } else {
        handlers['json'] = new JSONHandler('DEBUG');
    }

    await log.setup({
        handlers,
        loggers: Object.entries(loggers).reduce((loggers, [name, level]) => {
            loggers[name] = {
                level,
                handlers: [type],
            };
            return loggers;
        }, {} as NonNullable<log.LogConfig['loggers']>),
    });
}

export function getLogger(name?: string) {
    const logger = log.getLogger(name);
    return new FrugalLogger(logger);
}

await setup(DEFAULT_CONFIG);
