import * as _type from "../_type/fs.js";

import * as _fs from "../_dep/std/fs.js";
import * as errors from "./errors.js";
import { combine, debounce } from "../_utils.js";

export * as errors from "./errors.js";

/**
 * @param {string} path
 * @param {string | _type.ServerReadableStream<string>} data
 * @param {_type.WriteFileOptions} [options]
 * @returns {Promise<void>}
 */
export async function writeTextFile(path, data, { append = false, createNew = false } = {}) {
    try {
        return await Deno.writeTextFile(path, data, { append, createNew });
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @param {Uint8Array | _type.ServerReadableStream<Uint8Array>} data
 * @param {_type.WriteFileOptions} [options]
 * @returns {Promise<void>}
 */
export async function writeFile(path, data, { append = false, createNew = false } = {}) {
    try {
        return await Deno.writeFile(path, data, { append, createNew });
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function readTextFile(path) {
    try {
        return await Deno.readTextFile(path);
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @returns {Promise<Uint8Array>}
 */
export async function readFile(path) {
    try {
        return await Deno.readFile(path);
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @returns {Promise<AsyncIterable<_type.DirEntry>>}
 */
export async function readDir(path) {
    try {
        return await Promise.resolve(dirAdapt(Deno.readDir(path)));
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @param {_type.RemoveOptions} [options]
 * @returns {Promise<void>}
 */
export async function remove(path, { recursive = false } = {}) {
    try {
        return await Deno.remove(path, { recursive });
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} src
 * @param {string} dest
 * @param {_type.CopyOptions} [options]
 * @returns {Promise<void>}
 */
export async function copy(src, dest, { overwrite = false } = {}) {
    try {
        return await _fs.copy(src, dest, { overwrite });
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function ensureFile(path) {
    try {
        return await _fs.ensureFile(path);
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function ensureDir(path) {
    try {
        return await _fs.ensureDir(path);
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @returns {Promise<_type.FileInfo>}
 */
export async function stat(path) {
    try {
        const stat = await Deno.stat(path);
        return {
            isDirectory: () => stat.isDirectory,
            isFile: () => stat.isFile,
            size: stat.size,
            mtime: stat.mtime,
            atime: stat.atime,
            birthtime: stat.birthtime,
        };
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string} path
 * @returns {Promise<_type.ServerReadableStream<Uint8Array>>}
 */
export async function createReadableStream(path) {
    try {
        const file = await Deno.open(path);
        return file.readable;
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {_type.WatchOptions} [options]
 * @returns {_type.FsWatcher}
 */
export function watch(options) {
    return new Watcher(options);
}

/** @implements {_type.FsWatcher} */
class Watcher {
    /** @type {Deno.watchFs[]} */
    #watchers;
    /** @type {number} */
    #interval;
    /** @type {AsyncIterable<_type.FsEvent> | undefined} */
    #combinedAsyncIterable;

    /**
     * @param {string[]} paths
     * @param {_type.WatchOptions} [options]
     */
    constructor(paths, { interval = 300 } = {}) {
        this.#watchers = paths.map((path) => {
            console.log(path);
            return Deno.watchFs(path);
        });
        this.#interval = interval;
        this.#combinedAsyncIterable = combine(this.#watchers);
    }

    close() {
        this.#watchers.forEach((watcher) => {
            watcher.close();
        });
    }

    /** @returns {AsyncIterator<_type.FsEvent>} */
    [Symbol.asyncIterator]() {
        return this.#asyncIterator();
    }

    async *#asyncIterator() {
        for await (const entry of debounce(this.#combinedAsyncIterable, this.#interval)) {
            yield entry;
        }
    }
}

/**
 * @param {AsyncIterable<any>} dir
 * @returns {AsyncIterable<_type.DirEntry>}
 */

async function* dirAdapt(dir) {
    try {
        const iterator = dir[Symbol.asyncIterator]();
        let current = iterator.next();
        while (!(await current).done) {
            const entry = (await current).value;
            yield {
                name: entry.name,
                isDirectory: () => entry.isDirectory,
                isFile: () => entry.isFile,
            };
        }
    } catch (e) {
        throw mapError(e);
    }
    /*for await (const entry of dir) {
        yield {
            name: entry.name,
            isDirectory: () => entry.isDirectory,
            isFile: () => entry.isFile,
        };
    }*/
}

/** @param {any} error */
function mapError(error) {
    if (error instanceof Deno.errors.NotFound) {
        return new errors.NotFound(error.message);
    }
    if (error instanceof Deno.errors.AlreadyExists) {
        return new errors.AlreadyExists(error.message);
    }
    return error;
}
