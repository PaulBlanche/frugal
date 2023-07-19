import * as asserts from "../../../dep/std/testing/asserts.ts";

import { Config, context } from "../../../mod.ts";
import { BuildHelper, setupFiles, withPage } from "../../utils.ts";

if (import.meta.main) {
    const config = await loadConfig();
    await context(config).watch();
} else {
    await setupTestFiles();
}

Deno.test("watch: files are regenerated if page code changes", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt11 = firstBuildCache.get("/page1/1").updatedAt;
    const updatedAt12 = firstBuildCache.get("/page1/2").updatedAt;
    const updatedAt21 = firstBuildCache.get("/page2/1").updatedAt;
    const updatedAt22 = firstBuildCache.get("/page2/2").updatedAt;

    // add a comment at the top of page1.ts
    const page1ModuleURL = new URL("./project/page1.ts", import.meta.url);
    const originalData = await Deno.readTextFile(page1ModuleURL);
    await Deno.writeTextFile(page1ModuleURL, `//comment\n${originalData}`);

    await context.awaitNextBuild();

    const secondBuildChache = await context.cacheExplorer();
    // moduleHash of path1.ts changed, cache result is regenerated
    asserts.assertNotEquals(updatedAt11, secondBuildChache.get("/page1/1").updatedAt);
    asserts.assertNotEquals(updatedAt12, secondBuildChache.get("/page1/2").updatedAt);
    // moduleHash of path2.ts did not changed, cache result is not changed
    asserts.assertEquals(updatedAt21, secondBuildChache.get("/page2/1").updatedAt);
    asserts.assertEquals(updatedAt22, secondBuildChache.get("/page2/2").updatedAt);

    await Deno.writeTextFile(page1ModuleURL, originalData);

    await context.dispose();
});

Deno.test("watch: files are regenerated if dependency code changes", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt11 = firstBuildCache.get("/page1/1").updatedAt;
    const updatedAt12 = firstBuildCache.get("/page1/2").updatedAt;
    const updatedAt21 = firstBuildCache.get("/page2/1").updatedAt;
    const updatedAt22 = firstBuildCache.get("/page2/2").updatedAt;

    // add a comment at the top of store.ts
    const storeModuleURL = new URL("./project/store.ts", import.meta.url);
    const originalData = await Deno.readTextFile(storeModuleURL);
    await Deno.writeTextFile(storeModuleURL, `//comment\n${originalData}`);

    await context.awaitNextBuild();

    const secondBuildChache = await context.cacheExplorer();
    // moduleHash of path1.ts changed because of store.ts, cache result is regenerated
    asserts.assertNotEquals(updatedAt11, secondBuildChache.get("/page1/1").updatedAt);
    asserts.assertNotEquals(updatedAt12, secondBuildChache.get("/page1/2").updatedAt);
    // moduleHash of path2.ts changed because of store.ts, cache result is regenerated
    asserts.assertNotEquals(updatedAt21, secondBuildChache.get("/page2/1").updatedAt);
    asserts.assertNotEquals(updatedAt22, secondBuildChache.get("/page2/2").updatedAt);

    await Deno.writeTextFile(storeModuleURL, originalData);

    await context.dispose();
});

Deno.test("watch: files are regenerated on demand if data changes", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt11 = firstBuildCache.get("/page1/1").updatedAt;
    const updatedAt12 = firstBuildCache.get("/page1/2").updatedAt;
    const updatedAt21 = firstBuildCache.get("/page2/1").updatedAt;
    const updatedAt22 = firstBuildCache.get("/page2/2").updatedAt;

    // modify data.json but only data used by page1/1
    const dataURL = new URL("./project/data.json", import.meta.url);
    const originalData = await Deno.readTextFile(dataURL);
    const updatedData = JSON.parse(originalData);
    updatedData[0]["1"] = {
        "data": 110,
    };
    await Deno.writeTextFile(dataURL, JSON.stringify(updatedData, null, 4));

    const response11 = await fetch("http://localhost:8000/page1/1");
    await response11.text();
    const response22 = await fetch("http://localhost:8000/page2/2");
    await response22.text();

    const secondBuildChache = await context.cacheExplorer();
    // dataHash at /page1/1 changed and /page1/1 was visited, cache result is regenerated
    asserts.assertNotEquals(updatedAt11, secondBuildChache.get("/page1/1").updatedAt);
    // dataHash for any other page did not change (wether the page was visited
    // or not), cache result is not changed
    asserts.assertEquals(updatedAt12, secondBuildChache.get("/page1/2").updatedAt);
    asserts.assertEquals(updatedAt21, secondBuildChache.get("/page2/1").updatedAt);
    asserts.assertEquals(updatedAt22, secondBuildChache.get("/page2/2").updatedAt);

    await Deno.writeTextFile(dataURL, originalData);

    await context.dispose();
});

Deno.test("watch: browser reload on file change", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const page1ModuleURL = new URL("./project/page1.ts", import.meta.url);
    let originalData;

    await withPage(async ({ page }) => {
        await page.setJavaScriptEnabled(true);
        await page.goto("http://localhost:8000/page1/1");

        const pageReloadPromise = new Promise((res) => {
            page.exposeFunction("markReloaded", () => res(true));
        });
        await page.evaluate(`
            addEventListener("beforeunload", () => {
                markReloaded();
            });
        `);

        // add a comment at the top of page1.ts
        originalData = await Deno.readTextFile(page1ModuleURL);
        await Deno.writeTextFile(page1ModuleURL, `//comment\n${originalData}`);

        await context.awaitNextBuild();

        const reloaded = await pageReloadPromise;
        asserts.assertEquals(reloaded, true);
    });

    if (originalData) {
        await Deno.writeTextFile(page1ModuleURL, originalData);
    }

    await context.dispose();
});

Deno.test("watch: rebuild and browser reload on config change", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const configURL = new URL("./project/frugal.config.ts", import.meta.url);
    let originalData;

    await withPage(async ({ page }) => {
        await page.setJavaScriptEnabled(true);
        await page.goto("http://localhost:8000/page1/1");

        const pageReloadPromise = new Promise((res) => {
            page.exposeFunction("markReloaded", () => res(true));
        });
        await page.evaluate(`
            addEventListener("beforeunload", () => {
                markReloaded();
            });
        `);

        // add a comment at the top of frugal.config.ts
        originalData = await Deno.readTextFile(configURL);
        await Deno.writeTextFile(configURL, `//comment\n${originalData}`);

        await context.awaitNextBuild();

        const reloaded = await pageReloadPromise;
        asserts.assertEquals(reloaded, true);
    });

    await context.dispose();
});

async function setupTestFiles() {
    // clean everything from previous tests
    const base = new URL("./project/", import.meta.url);
    try {
        await Deno.remove(base, { recursive: true });
    } catch {}

    // setup clean files for current tests
    await setupFiles(base, {
        //####
        "./page1.ts": `import { DataResponse, RenderContext, StaticHandlerContext } from "../../../../page.ts";
import { store } from "./store.ts";

export const pattern = "/page1/:id";

export function getPaths() {
    return [{ id: "1" }, { id: "2" }];
}

export async function generate({ path }: StaticHandlerContext<typeof pattern>) {
    const dataStore = await store();
    const pageData = dataStore[0];
    return new DataResponse({
        data: pageData[path.id].data,
        headers: pageData[path.id].headers,
    });
}

export function render({ data, path }: RenderContext<typeof pattern, number>) {
    return \`data : \${data}, path: \${JSON.stringify(path)}\`;
}
`,

        //####
        "./page2.ts": `import { DataResponse, RenderContext, StaticHandlerContext } from "../../../../page.ts";
import { store } from "./store.ts";

export const pattern = "/page2/:id";

export function getPaths() {
    return [{ id: "1" }, { id: "2" }];
}

export async function generate({ path }: StaticHandlerContext<typeof pattern>) {
    const dataStore = await store();
    const pageData = dataStore[1];
    return new DataResponse({
        data: pageData[path.id].data,
        headers: pageData[path.id].headers,
    });
}

export function render({ data, path }: RenderContext<typeof pattern, number>) {
    return \`data : \${data}, path: \${JSON.stringify(path)}\`;
}
`,

        //####
        "./store.ts": `export const store = async () =>
JSON.parse(
    await Deno.readTextFile(new URL("../../../data.json", import.meta.url)),
);
`,

        //####
        "./data.json": `[
    {
        "1": {
            "data": 11
        },
        "2": {
            "data": 12,
            "headers": [
                [
                    "12",
                    "12"
                ]
            ]
        }
    },
    {
        "1": {
            "data": 21,
            "headers": [
                [
                    "21",
                    "21"
                ]
            ]
        },
        "2": {
            "data": 22,
            "headers": [
                [
                    "22",
                    "22"
                ]
            ]
        }
    }
]
`,

        //####
        "./frugal.config.ts": `import { Config } from "../../../../mod.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page1.ts", "./page2.ts"],
    log: { level: "silent" },
};
`,
    });
}

async function loadConfig(): Promise<Config> {
    // load config busting deno cache
    const hash = String(Date.now());
    const { config } = await import(`./project/frugal.config.ts#${hash}`);
    return config;
}
