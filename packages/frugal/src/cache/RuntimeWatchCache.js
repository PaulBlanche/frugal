import * as _type from "./_type/RuntimeWatchCache.js";
export * from "./_type/RuntimeWatchCache.js";

import * as cache from "./Cache.js";
import * as generationResult from "../page/GenerationResult.js";
import * as jsonValue from "../page/JSONValue.js";

/** @implements {cache.RuntimeCache} */
export class RuntimeWatchCache {
    /** @type {_type.WatchCacheData} */
    #data;

    /** @param {_type.WatchCacheData} [data] */
    constructor(data = {}) {
        this.#data = data;
    }

    /**
     * @template {string} PATH
     * @template {jsonValue.JSONValue} DATA
     * @param {generationResult.GenerationResult<PATH, DATA>} generationResult
     * @returns {Promise<void>}
     */
    async add(generationResult) {
        if (generationResult.path in this.#data) {
            const previous = this.#data[generationResult.path];
            const hash = await generationResult.hash;
            if (previous.hash === hash) {
                return;
            }
        }

        this.#data[generationResult.path] = await generationResult.serialize();
    }

    /**
     * @param {string} path
     * @returns {Promise<boolean>}
     */
    has(path) {
        const generationResult = this.#data[path];
        if (generationResult === undefined) {
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }

    /**
     * @param {string} path
     * @returns {Promise<Response | undefined>}
     */
    async get(path) {
        const result = this.#data[path];
        if (result === undefined) {
            return undefined;
        }

        return await generationResult.toResponse(result);
    }
}
