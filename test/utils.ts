import * as asserts from "../dep/std/testing/asserts.ts";
import * as fs from "../dep/std/fs.ts";

import { Config, Frugal } from "../mod.ts";
import { FrugalConfig } from "../src/Config.ts";
import { WatchContext } from "../src/WatchContext.ts";
import { BuildCacheData, loadBuildCacheData } from "../src/cache/BuildCache.ts";
import { WatchCache, WatchCacheData } from "../src/cache/WatchCache.ts";
import { loadManifest } from "../src/loadManifest.ts";
import { Router } from "../src/page/Router.ts";
import { FrugalServer } from "../src/server/FrugalServer.ts";
import puppeteer, { Browser, Page } from "../dep/puppeteer/mod.ts";
type WithBrowserOptions = {
    onClose?: () => Promise<void> | void;
};

export async function withBrowser(
    callback: (browser: Browser) => Promise<void>,
    options: WithBrowserOptions = {},
) {
    const browser = await puppeteer.launch();
    try {
        await callback(browser);
    } finally {
        await options?.onClose?.();
        await browser.close();
    }
}

type WithPageCallbackParams = {
    browser: Browser;
    page: Page;
};

export async function withPage(
    callback: ({ browser, page }: WithPageCallbackParams) => Promise<void>,
    options: WithBrowserOptions = {},
) {
    return withBrowser(async (browser) => {
        const page = await browser.newPage();
        try {
            await callback({ browser, page });
        } finally {
            await page.close();
        }
    }, options);
}

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

export class BuildHelper {
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

        const manifest = await loadManifest(this.#frugalConfig);

        const router = new Router({
            config: this.#frugalConfig,
            manifest,
            cache,
        });

        for (const route of router.routes) {
            if (route.type === "static") {
                await route.generator.buildAll();
            }
        }

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

export async function setupFiles(base: URL, files: Record<string, string>) {
    for (const [path, content] of Object.entries(files)) {
        const url = new URL(path, base);
        await fs.ensureFile(url);
        await Deno.writeTextFile(url, content);
    }
}
