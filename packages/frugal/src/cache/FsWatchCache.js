import * as _type from "./_type/FsWatchCache.js";
export * from "./_type/FsWatchCache.js";

import * as fs from "../../dependencies/fs.js";
import * as path from "../../dependencies/path.js";
import * as xxhash from "../../dependencies/xxhash.js";

import * as generationResult from "../page/GenerationResult.js";
import * as jsonValue from "../page/JSONValue.js";
import { FrugalConfig } from "../Config.js";
import { RuntimeWatchCache } from "./RuntimeWatchCache.js";

export class FsWatchCache extends RuntimeWatchCache {
    /** @type {FrugalConfig} */
    #config;
    /** @type {Map<string, string>} */
    #data;

    /** @param {FrugalConfig} config */
    constructor(config) {
        super();
        this.#config = config;
        this.#data = new Map();
    }

    /**
     * @template {string} PATH
     * @template {jsonValue.JSONValue} DATA
     * @param {generationResult.GenerationResult<PATH, DATA>} generationResult
     * @returns
     */
    async add(generationResult) {
        if (this.#data.has(generationResult.path)) {
            const previous = this.#data.get(generationResult.path);
            const hash = await generationResult.hash;
            if (previous === hash) {
                return;
            }
        }

        /** @type {_type.WatchCachEntry} */
        const data = {
            ...(await generationResult.serialize()),
            updatedAt: Date.now(),
        };

        this.#data.set(generationResult.path, await generationResult.hash);

        const pathHash = (await xxhash.create()).update(generationResult.path).digest();
        const dataPath = path.resolve(this.#config.outdir, `watchCache/${pathHash}`);
        await fs.ensureFile(dataPath);
        await fs.writeTextFile(dataPath, JSON.stringify(data));
    }

    /**
     * @param {string} path
     * @returns {Promise<boolean>}
     */
    has(path) {
        return Promise.resolve(this.#data.has(path));
    }

    /**
     * @param {string} generationPath
     * @returns {Promise<_type.WatchCachEntry | undefined>}
     */
    async getData(generationPath) {
        const pathHash = (await xxhash.create()).update(generationPath).digest();

        try {
            const url = path.resolve(this.#config.outdir, `watchCache/${pathHash}`);
            return JSON.parse(await fs.readTextFile(url));
        } catch (/** @type {any} */ error) {
            if (!(error instanceof fs.errors.NotFound)) {
                throw error;
            }
            return undefined;
        }
    }

    /**
     * @param {string} path
     * @returns {Promise<Response | undefined>}
     */
    async get(path) {
        const result = await this.getData(path);
        if (result === undefined) {
            return undefined;
        }

        return await generationResult.toResponse(result);
    }
}
