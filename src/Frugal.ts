import { Config, FrugalConfig } from "./Config.ts";
import { loadManifest } from "./Manifest.ts";
import { WatchContext } from "./WatchContext.ts";
import { Builder } from "./build/Builder.ts";
import { BuildCache } from "./cache/BuildCache.ts";
import { BuildCacheSnapshot } from "./cache/BuildCacheSnapshot.ts";
import { RuntimeWatchCache } from "./cache/RuntimeWatchCache.ts";
import { Router } from "./page/Router.ts";

export class Frugal {
    #config: FrugalConfig;

    constructor(config: Config) {
        this.#config = new FrugalConfig(config);
    }

    async build() {
        const builder = new Builder(this.#config);

        await builder.build();

        const cache = await BuildCache.load(this.#config);

        const router = new Router({
            config: this.#config,
            manifest: await loadManifest(this.#config),
            cache,
        });

        await router.buildAllStaticRoutes();

        await cache.save();

        await this.#config.exporter?.export({
            snapshot: await BuildCacheSnapshot.load(this.#config),
            config: this.#config,
        });
    }

    context() {
        return WatchContext.create(this.#config, new RuntimeWatchCache());
    }
}

export function build(config: Config) {
    const frugal = new Frugal(config);
    return frugal.build();
}

export function context(config: Config) {
    const frugal = new Frugal(config);
    return frugal.context();
}
