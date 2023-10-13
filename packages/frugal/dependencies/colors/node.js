import { Chalk } from "chalk";

const NO_COLOR = process.env["NO_COLOR"] !== undefined;

const chalkInstance = new Chalk({ level: NO_COLOR ? 0 : 1 });

/**
 * @param {string} string
 * @returns {string}
 */
export function grey(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.grey(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function yellow(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.yellow(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function brightRed(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.redBright(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bold(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.bold(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function red(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.red(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgGray(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.bgGray(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function brightWhite(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.whiteBright(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgBrightWhite(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.bgWhiteBright(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function brightYellow(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.yellowBright(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgBrightYellow(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.bgYellowBright(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgBrightRed(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.bgRedBright(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function blue(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.blue(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function black(string) {
    if (NO_COLOR) {
        return string;
    }
    return chalkInstance.black(string);
}
