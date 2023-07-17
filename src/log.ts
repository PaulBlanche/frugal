import * as colors from "../dep/std/fmt/colors.ts";

const LEVELS = {
    "silent": 0,
    "error": 1,
    "warning": 2,
    "info": 3,
    "debug": 4,
    "verbose": 5,
};

type Level = keyof typeof LEVELS;

type LogEntryConfig = {
    level: Exclude<Level, "silent">;
    scope: string;
    extra: string;
};

export type LogConfig = {
    level: Level;
    scopes: Record<string, Level | undefined>;
};

const GLOBAL_CONFIG: LogConfig = {
    level: "info",
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

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    timeZoneName: "short",
});

const DATE_FOMATTER = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" });

export function log(
    messageOrError: string | Error,
    {
        scope = "???",
        level = messageOrError instanceof Error ? "error" : "info",
        extra,
    }: Partial<
        LogEntryConfig
    > = {},
) {
    const currentLevel = GLOBAL_CONFIG.scopes[scope] ?? GLOBAL_CONFIG.level;

    if (LEVELS[currentLevel] < LEVELS[level]) {
        return;
    }
    const now = new Date();
    const date = colors.gray(
        `${DATE_FOMATTER.format(now)} ${TIME_FORMATTER.format(now)}`,
    );

    const message = `${date} ${formatLevel(level)} ${formatScope(scope, level)} ${
        formatMessage(messageOrError, level, extra)
    }`;

    console.log(message);
}

function formatMessage(
    messageOrError: Error | string,
    level: Level,
    extra?: string,
) {
    const msg = [formatMessageContent(messageOrError)];

    const formatedExtra = formatExtra(messageOrError, extra);
    if (formatedExtra) {
        msg.push(formatedExtra);
    }

    const message = msg.join("\n");

    switch (level) {
        case "warning":
            return colors.yellow(message);
        case "error":
            return colors.brightRed(message);
        case "debug":
        case "verbose": {
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

    return msg.join("\n");
}

function formatScope(
    scope: string,
    level: Level,
) {
    const formattedScope = colors.bold(` ${scope} >`);

    switch (level) {
        case "warning":
            return colors.yellow(formattedScope);
        case "error":
            return colors.red(formattedScope);
        case "debug":
        case "verbose": {
            return colors.gray(formattedScope);
        }
        default:
            return formattedScope;
    }
}

function formatLevel(level: Level) {
    const content = level.toUpperCase().padEnd(7);
    switch (level) {
        case "debug":
        case "verbose":
            return cell(content, 8);
        case "info":
            return cell(content, 15);
        case "warning":
            return cell(content, 11);
        case "error":
            return cell(content, 9);
    }
}

function cell(content: string, color: number) {
    const open = colors.rgb8("[", color);
    const close = colors.rgb8("]", color);
    return colors.bgRgb8(
        `${open}${colors.black(content)}${close}`,
        color,
    );
}
