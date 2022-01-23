import * as log from "../../dep/std/log.ts";
import * as colors from "../../dep/std/colors.ts";
import * as murmur from "../murmur/mod.ts";

type FrugalLogRecord = {
  msg?: string;
  logger: {
    level: number;
    levelName: log.LevelName;
    scope: string;
    datetime: Date;
    timerStart?: string;
    timerEnd?: string;
    delta?: number;
  };
};

class StopWatch {
  timers: Map<string, number>;

  constructor() {
    this.timers = new Map();
  }

  time(record: FrugalLogRecord) {
    if (record.logger.timerStart) {
      this.timers.set(record.logger.timerStart, performance.now());
    }

    if (record.logger.timerEnd && this.timers.has(record.logger.timerEnd)) {
      record.logger.delta = performance.now() -
        this.timers.get(record.logger.timerEnd)!;
    }
  }
}

class FrugalFormatter {
  private stopwatch: StopWatch;

  constructor() {
    this.stopwatch = new StopWatch();
  }

  format(logRecord: log.LogRecord): FrugalLogRecord {
    const data = this.parseData(logRecord);

    const record = {
      ...data,
      logger: {
        ...data.logger,
        level: logRecord.level,
        levelName: logRecord.levelName,
        scope: logRecord.loggerName,
        datetime: logRecord.datetime,
      },
    };

    this.stopwatch.time(record);

    return record;
  }

  private parseData(logRecord: log.LogRecord): any {
    try {
      return JSON.parse(logRecord.msg);
    } catch {
      return { msg: logRecord.msg };
    }
  }
}

class FrugalHandler extends log.handlers.ConsoleHandler {
  private frugalFormatter: FrugalFormatter;

  constructor(levelName: log.LevelName, options: log.HandlerOptions = {}) {
    super(levelName, options);
    this.frugalFormatter = new FrugalFormatter();
  }

  toFrugalRecord(logRecord: log.LogRecord): FrugalLogRecord {
    return this.frugalFormatter.format(logRecord);
  }
}

class JSONHandler extends FrugalHandler {
  format(logRecord: log.LogRecord): string {
    return JSON.stringify(this.toFrugalRecord(logRecord));
  }
}

class HumanHandler extends FrugalHandler {
  private colors: Map<string, number>;

  constructor(levelName: log.LevelName, options: log.HandlerOptions = {}) {
    super(levelName, options);
    this.colors = new Map();
  }

  format(logRecord: log.LogRecord): string {
    const record = this.toFrugalRecord(logRecord);

    const time =
      `${record.logger.datetime.toLocaleDateString()} ${record.logger.datetime.toLocaleTimeString()}`;
    const scope = record.logger.scope;
    const level = record.logger.levelName;

    switch (level) {
      case "CRITICAL":
      case "ERROR": {
        return colors.bgRed(
          colors.black(this.message(time, level, scope, record)),
        );
      }
      case "WARNING": {
        return colors.yellow(this.message(time, level, scope, record));
      }
      default: {
        const coloredScope = colors.rgb8(scope, this.scopeColorIndex(scope));
        return this.message(time, level, coloredScope, record);
      }
    }
  }

  private message(
    time: string,
    level: string,
    scope: string,
    record: FrugalLogRecord,
  ): string {
    const delta = record.logger.delta
      ? ` (done in ${record.logger.delta / 1000} s)`
      : "";

    return `[${time}|${level}|${scope}] - ${
      record.msg ?? JSON.stringify(record)
    }${delta}`;
  }

  private scopeColorIndex(scope: string): number {
    if (!this.colors.has(scope)) {
      const hash = new murmur.Hash().update(scope).number();

      const index = (hash % Math.floor((6 * 5 * 6 - 3) / 2)) * 2 + 19;

      this.colors.set(scope, index);
    }

    return this.colors.get(scope)!;
  }
}

type FrugalLogEntry = {
  msg?: string | (() => string);
  logger?: {
    timerStart?: string;
    timerEnd?: string;
    delta?: number;
  };
} & Record<string, any>;

export class FrugalLogger {
  logger: log.Logger;

  constructor(logger: log.Logger) {
    this.logger = logger;
  }

  private log<T extends FrugalLogEntry>(
    level: "info" | "debug" | "warning" | "error" | "critical",
    entry: T,
  ): Omit<T, "msg"> & { msg?: string } {
    const msg = typeof entry.msg === "function" ? entry.msg() : entry.msg;
    return this.logger[level]<T>({ ...entry, msg } as any) as any;
  }

  debug<T extends FrugalLogEntry>(entry: T): Omit<T, "msg"> & { msg?: string } {
    return this.log("debug", entry);
  }

  info<T extends FrugalLogEntry>(entry: T): Omit<T, "msg"> & { msg?: string } {
    return this.log("info", entry);
  }

  warning<T extends FrugalLogEntry>(
    entry: T,
  ): Omit<T, "msg"> & { msg?: string } {
    return this.log("warning", entry);
  }

  error<T extends FrugalLogEntry>(entry: T): Omit<T, "msg"> & { msg?: string } {
    return this.log("error", entry);
  }

  critical<T extends FrugalLogEntry>(
    entry: T,
  ): Omit<T, "msg"> & { msg?: string } {
    return this.log("critical", entry);
  }
}

export type Config = {
  type?: "human" | "json";
  loggers: {
    [name: string]: log.LevelName;
  };
};

const DEFAULT_CONFIG: Config = {
  loggers: {
    default: "DEBUG",
  },
};

export async function setup({ type = "human", loggers }: Config) {
  const handlers: { [s: string]: HumanHandler | JSONHandler } = {};

  if (type === "human") {
    handlers["human"] = new HumanHandler("DEBUG");
  } else {
    handlers["json"] = new JSONHandler("DEBUG");
  }

  await log.setup({
    handlers,
    loggers: Object.entries(loggers).reduce((loggers, [name, level]) => {
      loggers[name] = {
        level,
        handlers: [type],
      };
      return loggers;
    }, {} as NonNullable<log.LogConfig["loggers"]>),
  });
}

export function getLogger(name?: string) {
  const logger = log.getLogger(name);
  return new FrugalLogger(logger);
}

await setup(DEFAULT_CONFIG);
