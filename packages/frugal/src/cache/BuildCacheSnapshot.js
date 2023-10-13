import { FrugalConfig } from "../Config.js";
import * as buildCache from "./BuildCache.js";

export class BuildCacheSnapshot {
    /** @type {buildCache.BuildCacheEntry[]} */
    #added;
    /** @type {buildCache.BuildCacheEntry[]} */
    #evicted;
    /** @type {buildCache.BuildCacheEntry[]} */
    #current;

    /**
     * @param {FrugalConfig} config
     * @returns
     */
    static async load(config) {
        const data = await buildCache.loadBuildCacheData(config);
        if (data === undefined) {
            throw Error("error while loading build cache data");
        }
        return new BuildCacheSnapshot(data);
    }

    /** @param {buildCache.SerializedBuildCache} param0 */
    constructor({ current, previous }) {
        this.#current = Object.values(current);
        this.#added = [];
        this.#evicted = [];

        const keysInCurrent = new Set();
        for (const key in current) {
            keysInCurrent.add(key);
            if (current[key].age === "new") {
                this.#added.push(current[key]);
            }
        }

        for (const key in previous) {
            if (!keysInCurrent.has(key)) {
                this.#evicted.push(previous[key]);
            }
        }
    }

    get evicted() {
        return this.#evicted;
    }

    get added() {
        return this.#added;
    }

    get current() {
        return this.#current;
    }
}
