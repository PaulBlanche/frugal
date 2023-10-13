import * as _type from "../_type/fs.js";

import * as _fs from "node:fs";
import _events from "node:events";
import * as _path from "node:path";
import * as _stream from "node:stream";
import * as chokidar from "chokidar";

import * as errors from "./errors.js";
import { debounce } from "../_utils.js";

export * as errors from "./errors.js";

/**
 * @param {string} path
 * @param {string | _type.ServerReadableStream<string>} data
 * @param {_type.WriteFileOptions} [options]
 * @returns {Promise<void>}
 */
export async function writeTextFile(path, data, { append = false, createNew = false } = {}) {
    try {
        return await _fs.promises.writeFile(path, data, {
            flag: flag({ append, createNew }),
            encoding: "utf-8",
        });
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
        return await _fs.promises.writeFile(path, data, {
            flag: flag({ append, createNew }),
        });
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
        return await _fs.promises.readFile(path, { encoding: "utf-8" });
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
        return await _fs.promises.readFile(path);
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
        return await _fs.promises.opendir(path);
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
        return await _fs.promises.rm(path, { recursive });
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
        return await _fs.promises.cp(src, dest, { force: overwrite });
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
        await _fs.promises.mkdir(path, { recursive: true });
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
        await ensureDir(_path.dirname(path));
        const fileHandle = await _fs.promises.open(path, "a");
        await fileHandle.close();
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
        return await _fs.promises.stat(path);
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
        return await Promise.resolve(
            /** @type {_type.ServerReadableStream<Uint8Array>} */ (
                _stream.Readable.toWeb(_fs.createReadStream(path))
            ),
        );
    } catch (error) {
        throw mapError(error);
    }
}

/**
 * @param {string[]} paths
 * @param {_type.WatchOptions} [options]
 * @returns {_type.FsWatcher}
 */
export function watch(paths, options) {
    return new Watcher(paths, options);
}

/** @implements {_type.FsWatcher} */
class Watcher {
    /** @type {chokidar.FSWatcher} */
    #watcher;
    /** @type {number} */
    #interval;

    /**
     * @param {string[]} paths
     * @param {_type.WatchOptions} [options]
     */
    constructor(paths, { interval = 300 } = {}) {
        this.#watcher = chokidar.watch(paths);
        this.#interval = interval;
    }

    close() {
        this.#watcher.close();
    }

    /** @returns {AsyncIterator<_type.FsEvent>} */
    [Symbol.asyncIterator]() {
        return this.#asyncIterator();
    }

    async *#asyncIterator() {
        const chokidarAsyncIterator =
            /** @type {AsyncIterable<["add" | "addDir" | "change" | "unlink" | "unlinkDir", string]>} */ (
                _events.on(this.#watcher, "all")
            );

        for await (const events of debounce(chokidarAsyncIterator, this.#interval)) {
            /** @type {Partial<Record<_type.FsEvent["type"], string[]>>} */
            const combinedEvents = {};

            for (const [type, path] of events) {
                const standardType = this.#mapEventType(type);
                combinedEvents[standardType] = combinedEvents[standardType] ?? [];
                combinedEvents[standardType]?.push(path);
                combinedEvents["any"] = combinedEvents["any"] ?? [];
                combinedEvents["any"]?.push(path);
            }

            for (const [type, paths] of Object.entries(combinedEvents)) {
                yield /** @type {_type.FsEvent} */ ({ type, paths });
            }
        }
    }

    /**
     * @param {"add" | "addDir" | "change" | "unlink" | "unlinkDir"} type
     * @returns {_type.FsEvent["type"]}
     */
    #mapEventType(type) {
        switch (type) {
            case "add": {
                return "create";
            }
            case "addDir": {
                return "create";
            }
            case "change": {
                return "modify";
            }
            case "unlink": {
                return "remove";
            }
            case "unlinkDir": {
                return "remove";
            }
        }
    }
}

/** @param {_type.WriteFileOptions} options */
function flag(options) {
    if (options.append) {
        if (options.createNew) {
            return "ax";
        } else {
            return "a";
        }
    }
    if (options.createNew) {
        return "wx";
    }
    return "w";
}

/** @param {any} error */
function mapError(error) {
    if (error.code === "ENOENT") {
        return new errors.NotFound(error.message);
    }
    if (error.code === "EEXIST") {
        return new errors.AlreadyExists(error.message);
    }
    return error;
}
