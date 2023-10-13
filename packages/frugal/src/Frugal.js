import * as config from "./Config.js";
import { loadManifest } from "./Manifest.js";
import { WatchContext } from "./watch/WatchContext.js";
import { EsbuildWrapper } from "./esbuild/EsbuildWrapper.js";
import { BuildCache } from "./cache/BuildCache.js";
import { BuildCacheSnapshot } from "./cache/BuildCacheSnapshot.js";
import { RuntimeWatchCache } from "./cache/RuntimeWatchCache.js";
import { Router } from "./page/Router.js";
import { log } from "./log.js";

export class Frugal {
    /** @type {config.FrugalConfig} */
    #config;

    /** @param {config.Config} conf */
    constructor(conf) {
        this.#config = new config.FrugalConfig(conf);

        if (this.#config.exporter?.platform === "deno" && this.#config.platform !== "deno") {
            const error = new Error(
                "The configured exporter targets Deno, but you are not running your code with Deno.",
            );
            log(error, { scope: "Frugal" });
            throw error;
        }
        if (this.#config.exporter?.platform === "node" && this.#config.platform !== "node") {
            const error = new Error(
                "The configured exporter targets Node, but you are not running your code with Node.",
            );
            log(error, { scope: "Frugal" });
            throw error;
        }
    }

    async build() {
        const builder = new EsbuildWrapper(this.#config);

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

/** @param {config.Config} config */
export function build(config) {
    const frugal = new Frugal(config);
    return frugal.build();
}

/** @param {config.Config} config */
export function context(config) {
    const frugal = new Frugal(config);
    return frugal.context();
}
