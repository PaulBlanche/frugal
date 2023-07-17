import * as xxhash from "../../dep/xxhash.ts";
import { FrugalConfig } from "../Config.ts";
import { log } from "../log.ts";
import { BuildCache } from "../cache/BuildCache.ts";

export class Persister {
    #cache: BuildCache;
    #config: FrugalConfig;

    constructor(cache: BuildCache, config: FrugalConfig) {
        this.#cache = cache;
        this.#config = config;
    }

    async persist() {
        const diff = this.#cache.diff;
        if (diff === undefined) {
            throw Error("");
        }

        log(`Clear cache storage`, {
            scope: "BuildContext",
            level: "debug",
        });

        await this.#config.cacheStorage.empty();
        await Promise.all(
            Object.values(diff.all).map(async (response) => {
                log(`Persist set "${response.path}" (${response.hash}) in cache storage`, {
                    scope: "BuildContext",
                    level: "debug",
                });
                const hash = (await xxhash.create()).update(response.path).digest("hex").toString();
                await this.#config.cacheStorage.set(hash, JSON.stringify(response, undefined, 2));
            }),
        );
    }
}
