import * as _path from "node:path";
import * as _url from "node:url";
import commonPath from "common-path-prefix";

/**
 * @param {string} path
 * @returns {string}
 */
export function dirname(path) {
    return _path.dirname(path);
}

/**
 * @param {string[]} paths
 * @returns {string}
 */
export function join(...paths) {
    return _path.join(...paths);
}

/**
 * @param {string} path
 * @param {string} [ext]
 * @returns {string}
 */
export function basename(path, ext) {
    return _path.basename(path, ext);
}

/**
 * @param {string} path
 * @returns {string}
 */
export function extname(path) {
    return _path.extname(path);
}

/**
 * @param {string} path
 * @returns {string}
 */
export function normalize(path) {
    return _path.normalize(path);
}

/**
 * @param {string | URL} url
 * @returns {string}
 */
export function fromFileURL(url) {
    return _url.fileURLToPath(url);
}

/**
 * @param {string} path
 * @returns {URL}
 */
export function toFileURL(path) {
    return _url.pathToFileURL(path);
}

/**
 * @param {string[]} pathSegments
 * @returns {string}
 */
export function resolve(...pathSegments) {
    return _path.resolve(...pathSegments);
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
export function relative(from, to) {
    return _path.relative(from, to);
}

/**
 * @param {string[]} paths
 * @returns {string}
 */
export function common(paths) {
    if (paths.length === 1) {
        return dirname(paths[0]);
    }
    return commonPath(paths);
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isAbsolute(path) {
    return _path.isAbsolute(path);
}

export const SEP = _path.sep;
