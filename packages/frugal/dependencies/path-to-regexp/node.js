import * as pathToRegexp from "path-to-regexp";

/**
 * @template {object} P
 * @param {string} path
 * @returns {pathToRegexp.PathFunction<P>}
 */
export function compile(path) {
    return pathToRegexp.compile(path);
}

/**
 * @template {object} P
 * @param {string} path
 * @returns {pathToRegexp.MatchFunction<P>}
 */
export function match(path) {
    return pathToRegexp.match(path);
}
