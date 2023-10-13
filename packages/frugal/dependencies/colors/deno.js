import * as colors from "../_dep/std/fmt/colors.js";

const NO_COLOR = Deno.env.get("NO_COLOR") !== undefined;

/**
 * @param {string} string
 * @returns {string}
 */
export function grey(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.gray(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function yellow(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.yellow(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function brightRed(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.brightRed(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bold(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.bold(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function red(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.red(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgGray(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.bgBrightBlack(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function brightWhite(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.brightWhite(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgBrightWhite(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.bgBrightWhite(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function brightYellow(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.brightYellow(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgBrightYellow(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.bgBrightYellow(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function bgBrightRed(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.bgBrightRed(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function blue(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.blue(string);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function black(string) {
    if (NO_COLOR) {
        return string;
    }
    return colors.black(string);
}
