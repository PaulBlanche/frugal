import * as generationResult from "../page/GenerationResult.js";
import * as jsonValue from "../page/JSONValue.js";
import * as cache from "./Cache.js";
import * as cacheStorage from "./CacheStorage.js";

/** @implements {cache.RuntimeCache} */
export class RuntimeStorageCache {
    /** @type {cacheStorage.CacheStorage} */
    #cacheStorage;

    /** @param {cacheStorage.CacheStorage} cacheStorage */
    constructor(cacheStorage) {
        this.#cacheStorage = cacheStorage;
    }

    /**
     * @template {string} PATH
     * @template {jsonValue.JSONValue} DATA
     * @param {generationResult.GenerationResult<PATH, DATA>} generationResult
     * @returns {Promise<void>}
     */
    async add(generationResult) {
        return this.#cacheStorage.set(
            generationResult.path,
            JSON.stringify(await generationResult.serialize()),
        );
    }

    /**
     * @param {string} key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        const data = await this.#cacheStorage.get(key);
        if (data === undefined) {
            return false;
        }
        return true;
    }

    /**
     * @param {string} key
     * @returns {Promise<Response | undefined>}
     */
    async get(key) {
        const data = await this.#cacheStorage.get(key);
        if (data === undefined) {
            return undefined;
        }
        /** @type {generationResult.SerializedGenerationResult} */
        const result = JSON.parse(data);

        return generationResult.toResponse(result);
    }
}
