import { WatchContext } from "../../src/WatchContext.ts";
import { FsWatchCache } from "../../src/cache/FsWatchCache.ts";

export class WatchHelper {
    #context: WatchContext;
    #cache: FsWatchCache;

    constructor(context: WatchContext, watchCache: FsWatchCache) {
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
            const listener = (event: any) => {
                if (event === "reload") {
                    res();
                    this.#context.removeEventListener(listener);
                }
            };
            this.#context.addEventListener(listener);
        });
    }

    async cacheExplorer() {
        return new WatchCachExplorer(this.#cache);
    }
}

class WatchCachExplorer {
    #cache: FsWatchCache;

    constructor(cache: FsWatchCache) {
        this.#cache = cache;
    }

    get(path: string) {
        return this.#cache.getData(path);
    }
}
