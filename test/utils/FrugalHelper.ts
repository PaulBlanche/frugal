import * as asserts from "../../dep/std/testing/asserts.ts";

import { Config, Frugal } from "../../mod.ts";
import { FrugalConfig } from "../../src/Config.ts";
import { WatchContext } from "../../src/WatchContext.ts";
import { BuildCacheData, loadBuildCacheData } from "../../src/cache/BuildCache.ts";
import { WatchCache } from "../../src/cache/WatchCache.ts";
import { Router } from "../../src/page/Router.ts";
import { FrugalServer } from "../../src/server/FrugalServer.ts";
import { WatchHelper } from "./WatchHelper.ts";

export class FrugalHelper {
    #config: Config;
    #frugalConfig: FrugalConfig;

    constructor(config: Config) {
        const outdir = `./dist/${crypto.randomUUID()}/`;
        this.#config = { outdir, ...config };
        this.#frugalConfig = new FrugalConfig(this.#config);
    }

    get config() {
        return this.#frugalConfig;
    }

    async build() {
        const frugal = new Frugal(this.#config);
        await frugal.build();
    }

    context() {
        const cache = new WatchCache();
        const context = WatchContext.create(this.#frugalConfig, cache);
        return new WatchHelper(context, cache);
    }

    async cacheExplorer() {
        return await BuildCacheExplorer.load(this.#frugalConfig);
    }

    async withServer(callback: () => Promise<void> | void) {
        const controller = new AbortController();
        try {
            await this.serve(controller.signal);
            await callback();
        } finally {
            controller.abort();
        }
    }

    async serve(signal: AbortSignal): Promise<void> {
        const cache = new WatchCache();

        const router = await Router.load({
            config: this.#frugalConfig,
            cache,
        });

        await router.buildAllStaticRoutes();

        const server = new FrugalServer({
            config: this.#frugalConfig,
            router,
            cache,
            watchMode: false,
        });

        return new Promise((resolve) =>
            server.serve({
                signal,
                onListen: () => resolve(),
            })
        );
    }

    async clean() {
        try {
            await Deno.remove(this.#frugalConfig.outdir, { recursive: true });
        } catch {
            // empty on purpose
        }
    }
}

class BuildCacheExplorer {
    #config: FrugalConfig;
    #data: BuildCacheData;

    static async load(config: FrugalConfig) {
        const data = await loadBuildCacheData(config);
        if (data === undefined) {
            throw Error("error while loading cache data");
        }
        return new BuildCacheExplorer(config, data.current);
    }

    constructor(config: FrugalConfig, data: BuildCacheData) {
        this.#config = config;
        this.#data = data;
    }

    get(path: string) {
        return this.#data[path];
    }

    async loadDocument(path: string) {
        const documentPath = this.#data[path].documentPath;
        if (documentPath === undefined) {
            return undefined;
        }
        return await Deno.readTextFile(new URL(documentPath, this.#config.buildCacheFile));
    }

    entries() {
        return Object.entries(this.#data).sort((a, b) => a[0].localeCompare(b[0]));
    }

    keys() {
        return Object.keys(this.#data).sort((a, b) => a.localeCompare(b));
    }

    async assertContent(expected: [string, Partial<BuildCacheData[string] & { body: string }>][]) {
        const actual = this.entries();
        asserts.assertEquals(actual.length, expected.length);
        await Promise.all(actual.map(async ([actualKey, actualValue], index) => {
            const [expectedKey, expectedValue] = expected[index];
            asserts.assertEquals(actualKey, expectedKey);
            const body = await this.loadDocument(actualKey);
            asserts.assertObjectMatch({ ...actualValue, body }, expectedValue);
        }));
    }
}
