import * as _type from "./_type/BuildCache.js";
export * from "./_type/BuildCache.js";

import * as path from "../../dependencies/path.js";
import * as fs from "../../dependencies/fs.js";
import * as xxhash from "../../dependencies/xxhash.js";

import * as cache from "./Cache.js";
import { FrugalConfig } from "../Config.js";
import * as generationResult from "../page/GenerationResult.js";
import * as jsonValue from "../page/JSONValue.js";
import { log } from "../log.js";

/** @implements {cache.Cache} */
export class BuildCache {
    /** @type {FrugalConfig} */
    #config;
    /** @type {_type.BuildCacheData} */
    #previous;
    /** @type {_type.BuildCacheData} */
    #current;

    /**
     * @param {FrugalConfig} config
     * @returns {Promise<BuildCache>}
     */
    static async load(config) {
        const data = await loadBuildCacheData(config);
        return new BuildCache(config, data?.current);
    }

    /**
     * @param {FrugalConfig} config
     * @param {_type.BuildCacheData} [previous]
     */
    constructor(config, previous = {}) {
        this.#config = config;
        this.#previous = previous;
        this.#current = {};
    }

    /**
     * @template {string} PATH
     * @template {jsonValue.JSONValue} DATA
     * @param {generationResult.GenerationResult<PATH, DATA>} generationResult
     * @returns
     */
    async add(generationResult) {
        log(`Add response "${generationResult.path}"`, { scope: "BuildCache", level: "verbose" });

        if (generationResult.path in this.#previous) {
            const previous = this.#previous[generationResult.path];
            const hash = await generationResult.hash;
            if (previous.hash === hash) {
                log(`keep previous response for path ${generationResult.path}`, {
                    scope: "BuildCache",
                    level: "verbose",
                });
                this.#current[generationResult.path] = this.#previous[generationResult.path];
                this.#current[generationResult.path].age = "old";
                return;
            }
        }

        log(`replace previous response for path ${generationResult.path}`, {
            scope: "BuildCache",
            level: "verbose",
        });
        const serialized = await generationResult.serialize();
        const name = (await xxhash.create()).update(generationResult.path).digest();
        /** @type {_type.BuildCacheEntry} */
        const entry = {
            path: serialized.path,
            hash: serialized.hash,
            headers: serialized.headers,
            status: serialized.status,
            age: "new",
        };
        if (serialized.body) {
            const bodyPath = path.resolve(
                path.dirname(this.#config.buildCacheFile),
                `./buildcache/${name}`,
            );
            await fs.ensureFile(bodyPath);
            await fs.writeTextFile(bodyPath, serialized.body);
            entry.documentPath = `./buildcache/${name}`;
        }
        this.#current[generationResult.path] = entry;
    }

    async save() {
        await fs.ensureFile(this.#config.buildCacheFile);
        await fs.writeTextFile(
            this.#config.buildCacheFile,
            JSON.stringify({ current: this.#current, previous: this.#previous }, undefined, 2),
        );
    }
}

/**
 * @param {FrugalConfig} config
 * @returns {Promise<_type.SerializedBuildCache | undefined>}
 */
export async function loadBuildCacheData(config) {
    try {
        const data = await fs.readTextFile(config.buildCacheFile);
        return JSON.parse(data);
    } catch {
        return undefined;
    }
}
