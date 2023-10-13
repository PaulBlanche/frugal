import * as _type from "./_type/log.js";
export * from "./_type/log.js";

import * as colors from "../dependencies/colors.js";

/** @enum {number} */
export const LEVELS = /** @type {const} */ ({
    silent: 0,
    error: 1,
    warning: 2,
    info: 3,
    debug: 4,
    verbose: 5,
});

/** @type {_type.LogConfig} */
const GLOBAL_CONFIG = {
    level: "info",
    scopes: {},
};

/** @param {Partial<_type.LogConfig>} config */
export function config(config) {
    Object.assign(GLOBAL_CONFIG, config);
}

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    timeZoneName: "short",
});

const DATE_FOMATTER = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" });

/**
 * @param {string | Error} messageOrError
 * @param {Partial<_type.LogEntry>} [param1]
 * @returns {void}
 */
export function log(
    messageOrError,
    { scope = "???", level = messageOrError instanceof Error ? "error" : "info", extra } = {},
) {
    const currentLevel = GLOBAL_CONFIG.scopes[scope] ?? GLOBAL_CONFIG.level;

    if (LEVELS[currentLevel] < LEVELS[level]) {
        return;
    }
    const now = new Date();
    const date = colors.grey(`${DATE_FOMATTER.format(now)} ${TIME_FORMATTER.format(now)}`);

    const message = `${date} ${formatLevel(level)} ${formatScope(scope, level)} ${formatMessage(
        messageOrError,
        level,
        extra,
    )}`;

    console.log(message);
}

/**
 * @param {string | Error} messageOrError
 * @param {_type.Level} level
 * @param {string} [extra]
 * @returns {string}
 */
function formatMessage(messageOrError, level, extra) {
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
            return colors.grey(message);
        }
        default:
            return message;
    }
}

/**
 * @param {string | Error} messageOrError
 * @returns {string}
 */
function formatMessageContent(messageOrError) {
    if (messageOrError instanceof Error) {
        return `${messageOrError.name} : ${messageOrError.message}`;
    } else {
        return String(messageOrError);
    }
}

/**
 * @param {string | Error} messageOrError
 * @param {string} [extra]
 * @returns {string | undefined}
 */
function formatExtra(messageOrError, extra) {
    if (!(messageOrError instanceof Error)) {
        return extra;
    }

    return `\n${formatError(messageOrError)}`;
}

/**
 * @param {any} cause
 * @returns {string}
 */
function formatCause(cause) {
    if (cause instanceof Error) {
        return formatError(cause);
    }
    {
        return String(cause);
    }
}

/**
 * @param {Error} error
 * @returns {string}
 */
function formatError(error) {
    const stack = error.stack ?? `${error.name} : ${error.message}\n    [no stack]`;

    const msg = [stack];
    if (error.cause) {
        msg.push(`\ncaused by ${formatCause(error.cause)}`);
    }

    return msg.join("\n");
}

/**
 * @param {string} scope
 * @param {_type.Level} level
 * @returns
 */
function formatScope(scope, level) {
    const formattedScope = colors.bold(` ${scope} >`);

    switch (level) {
        case "warning":
            return colors.yellow(formattedScope);
        case "error":
            return colors.red(formattedScope);
        case "debug":
        case "verbose": {
            return colors.grey(formattedScope);
        }
        default:
            return formattedScope;
    }
}

/**
 * @param {_type.Level} level
 * @returns {string | undefined}
 */
function formatLevel(level) {
    const content = level.toUpperCase().padEnd(7);
    switch (level) {
        case "debug":
        case "verbose":
            return cell(content, colors.grey, colors.bgGray);
        case "info":
            return cell(content, colors.brightWhite, colors.bgBrightWhite);
        case "warning":
            return cell(content, colors.brightYellow, colors.bgBrightYellow);
        case "error":
            return cell(content, colors.brightRed, colors.bgBrightRed);
    }
}

/**
 * @param {string} content
 * @param {(str: string) => string} fg
 * @param {(str: string) => string} bg
 * @returns {string}
 */
function cell(content, fg, bg) {
    return bg(`${fg("[")}${colors.black(content)}${fg("]")}`);
}
