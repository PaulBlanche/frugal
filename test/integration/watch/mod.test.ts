import * as asserts from "../../../dep/std/testing/asserts.ts";

import { Config, context } from "../../../mod.ts";
import { BuildHelper, withPage } from "../../utils.ts";
import { config } from "./frugal.config.ts";

if (import.meta.main) {
    await context(config).watch();
}

Deno.test("watch: files are regenerated if page code changes", async (t) => {
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
    const page1ModuleURL = new URL("./page1.ts", import.meta.url);
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
    const storeModuleURL = new URL("./store.ts", import.meta.url);
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
    const dataURL = new URL("./data.json", import.meta.url);
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
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const page1ModuleURL = new URL("./page1.ts", import.meta.url);
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
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const configURL = new URL("./frugal.config.ts", import.meta.url);
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
