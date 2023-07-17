import * as asserts from "../dep/std/testing/asserts.ts";

import { build, Config, Frugal } from "../mod.ts";
import { FrugalConfig } from "../src/Config.ts";
import { BuildCacheData, loadBuildCacheData } from "../src/cache/BuildCache.ts";
import { WatchCache } from "../src/cache/WatchCache.ts";
import { loadManifest } from "../src/loadManifest.ts";
import { Router } from "../src/page/Router.ts";
import { FrugalServer } from "../src/server/FrugalServer.ts";

export type Helper = {
    config: FrugalConfig;
    build: () => Promise<void>;
    cacheExplorer: () => Promise<CacheExplorer>;
    serve: (signal: AbortSignal) => Promise<void>;
    clean: () => Promise<void>;
};

export function getHelper(config: Config): Helper {
    const outdir = `./dist/${crypto.randomUUID()}/`;
    const patchedConfig = { outdir, ...config };
    const frugalConfig = new FrugalConfig(patchedConfig);

    return {
        config: frugalConfig,
        build: async () => {
            const frugal = new Frugal(patchedConfig);
            await frugal.build();
        },
        cacheExplorer: async () => {
            return await CacheExplorer.load(frugalConfig);
        },
        serve: async (signal) => {
            const cache = new WatchCache();

            const manifest = await loadManifest(frugalConfig);

            const router = new Router({
                config: frugalConfig,
                manifest,
                cache,
            });

            for (const route of router.routes) {
                if (route.type === "static") {
                    await route.generator.buildAll();
                }
            }

            const server = new FrugalServer({
                config: frugalConfig,
                router,
                cache,
                watchMode: false,
            });

            return new Promise((resolve) => server.serve({ signal, onListen: () => resolve() }));
        },
        clean: async () => {
            try {
                await Deno.remove(new URL(patchedConfig.outdir, config.self), {
                    recursive: true,
                });
            } catch {
                // empty on purpose
            }
        },
    };
}

class CacheExplorer {
    #config: FrugalConfig;
    #data: BuildCacheData;

    static async load(config: FrugalConfig) {
        const data = await loadBuildCacheData(config);
        if (data === undefined) {
            throw Error("error while loading cache data");
        }
        return new CacheExplorer(config, data.current);
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
