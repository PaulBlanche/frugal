import { FrugalConfig } from "../Config.ts";
import { BuildCacheEntry, loadBuildCacheData, SerializedBuildCache } from "./BuildCache.ts";

export class BuildCacheSnapshot {
    #added: BuildCacheEntry[];
    #evicted: BuildCacheEntry[];
    #current: BuildCacheEntry[];

    static async load(config: FrugalConfig) {
        const data = await loadBuildCacheData(config);
        if (data === undefined) {
            throw Error("error while loading build cache data");
        }
        return new BuildCacheSnapshot(data);
    }

    constructor({ current, previous }: SerializedBuildCache) {
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
