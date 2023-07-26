import * as asserts from "../../dep/std/testing/asserts.ts";

import { WatchContext } from "../../src/WatchContext.ts";
import { WatchCache, WatchCacheData } from "../../src/cache/WatchCache.ts";

export class WatchHelper {
    #context: WatchContext;
    #cache: WatchCache;

    constructor(context: WatchContext, watchCache: WatchCache) {
        this.#cache = watchCache;
        this.#context = context;
    }

    async watch() {
        return this.#context.watch();
    }

    async dispose() {
        return this.#context.dispose();
    }

    async awaitNextBuild() {
        await new Promise<void>((res) => {
            const listener = () => {
                res();
                this.#context.removeEventListener(listener);
            };
            this.#context.addEventListener(listener);
        });
    }

    async cacheExplorer() {
        return new WatchCachExplorer(this.#cache._data);
    }
}

class WatchCachExplorer {
    #data: WatchCacheData;

    constructor(data: WatchCacheData) {
        this.#data = data;
    }

    get(path: string) {
        return this.#data[path];
    }

    entries() {
        return Object.entries(this.#data).sort((a, b) => a[0].localeCompare(b[0]));
    }

    keys() {
        return Object.keys(this.#data).sort((a, b) => a.localeCompare(b));
    }

    async assertContent(expected: [string, Partial<WatchCacheData[string]>][]) {
        const actual = this.entries();
        asserts.assertEquals(actual.length, expected.length);
        await Promise.all(actual.map(async ([actualKey, actualValue], index) => {
            const [expectedKey, expectedValue] = expected[index];
            asserts.assertEquals(actualKey, expectedKey);
            asserts.assertObjectMatch(actualValue, expectedValue);
        }));
    }
}
