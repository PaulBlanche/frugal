import * as colors from '../dep/std/fmt/colors.ts';

const LEVELS = {
    'silent': 0,
    'error': 1,
    'warning': 2,
    'info': 3,
    'debug': 4,
    'verbose': 5,
};

type Level = keyof typeof LEVELS;

type LogEntryConfig = {
    kind: Exclude<Level, 'silent'>;
    scope: string;
    scopeExtra?: string;
    extra: string;
};

export type LogConfig = {
    level: Level;
    scopes: Record<string, Level | undefined>;
};

const GLOBAL_CONFIG: LogConfig = {
    level: 'info',
    scopes: {},
};

export function config(config: Partial<LogConfig>) {
    Object.assign(GLOBAL_CONFIG, config);
}

export type Log = (
    messageOrError: string | Error,
    options?: Partial<
        LogEntryConfig
    >,
) => void;

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    timeZoneName: 'short',
});

const DATE_FOMATTER = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

export function log(
    messageOrError: string | Error,
    {
        scope = '???',
        scopeExtra,
        kind = messageOrError instanceof Error ? 'error' : 'info',
        extra,
    }: Partial<
        LogEntryConfig
    > = {},
) {
    const level = GLOBAL_CONFIG.scopes[scope] ?? GLOBAL_CONFIG.level;

    if (LEVELS[level] < LEVELS[kind]) {
        return;
    }
    const now = new Date();
    const date = colors.gray(
        `${DATE_FOMATTER.format(now)} ${TIME_FORMATTER.format(now)}`,
    );

    const message = `${date} ${formatKind(kind)} ${formatScope(scope, scopeExtra, kind)} ${
        formatMessage(messageOrError, kind, extra)
    }`;

    console.log(message);
}

function formatMessage(
    messageOrError: Error | string,
    kind: Level,
    extra?: string,
) {
    const msg = [formatMessageContent(messageOrError)];

    const formatedExtra = formatExtra(messageOrError, extra);
    if (formatedExtra) {
        msg.push(formatedExtra);
    }

    const message = msg.join('\n');

    switch (kind) {
        case 'warning':
            return colors.yellow(message);
        case 'error':
            return colors.brightRed(message);
        case 'debug':
        case 'verbose': {
            return colors.gray(message);
        }
        default:
            return message;
    }
}

// deno-lint-ignore no-explicit-any
function formatMessageContent(messageOrError: any) {
    if (messageOrError instanceof Error) {
        return `${messageOrError.name} : ${messageOrError.message}`;
    } else {
        return String(messageOrError);
    }
}

function formatExtra(messageOrError: Error | string, extra?: string) {
    if (!(messageOrError instanceof Error)) {
        return extra;
    }

    return `\n${formatError(messageOrError)}`;
}

// deno-lint-ignore no-explicit-any
function formatCause(cause: any) {
    if (cause instanceof Error) {
        return formatError(cause);
    }
    {
        return String(cause);
    }
}

function formatError(error: Error): string {
    const stack = error.stack ??
        `${error.name} : ${error.message}\n    [no stack]`;

    const msg = [stack];
    if (error.cause) {
        msg.push(`\ncaused by ${formatCause(error.cause)}`);
    }

    return msg.join('\n');
}

function formatScope(
    scope: string,
    scopeExtra: string | undefined,
    kind: Level,
) {
    const fullScope = scopeExtra ? `${scope}:${scopeExtra}` : scope;
    const formattedScope = colors.bold(` ${fullScope} >`);

    switch (kind) {
        case 'warning':
            return colors.yellow(formattedScope);
        case 'error':
            return colors.red(formattedScope);
        case 'debug':
        case 'verbose': {
            return colors.gray(formattedScope);
        }
        default:
            return formattedScope;
    }
}

function formatKind(kind: Level) {
    const content = kind.toUpperCase().padEnd(7);
    switch (kind) {
        case 'debug':
        case 'verbose':
            return cell(content, 8);
        case 'info':
            return cell(content, 15);
        case 'warning':
            return cell(content, 11);
        case 'error':
            return cell(content, 9);
    }
}

function cell(content: string, color: number) {
    const open = colors.rgb8('[', color);
    const close = colors.rgb8(']', color);
    return colors.bgRgb8(
        `${open}${colors.black(content)}${close}`,
        color,
    );
}
