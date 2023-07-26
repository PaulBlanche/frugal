import * as asserts from "../../../dep/std/testing/asserts.ts";
import * as fs from "../../../dep/std/fs.ts";

import { Config } from "../../../mod.ts";
import { FrugalHelper } from "../../utils/FrugalHelper.ts";

await setupTestFiles();
const config = await loadConfig();

Deno.test("incremental", async () => {
    const helper = new FrugalHelper(config);

    await helper.build();
    const firstBuildCache = await helper.cacheExplorer();
    asserts.assertEquals(firstBuildCache.get("/page1/1").age, "new");
    asserts.assertEquals(firstBuildCache.get("/page1/2").age, "new");
    asserts.assertEquals(firstBuildCache.get("/page2/1").age, "new");
    asserts.assertEquals(firstBuildCache.get("/page2/2").age, "new");

    await helper.build();
    const secondBuildChache = await helper.cacheExplorer();
    asserts.assertEquals(secondBuildChache.get("/page1/1").age, "old");
    asserts.assertEquals(secondBuildChache.get("/page1/2").age, "old");
    asserts.assertEquals(secondBuildChache.get("/page2/1").age, "old");
    asserts.assertEquals(secondBuildChache.get("/page2/2").age, "old");
});

Deno.test("incremental: files are regenerated if page code changes", async () => {
    const helper = new FrugalHelper(config);

    await helper.build();

    // add a comment at the top of page1.ts
    const page1ModuleURL = new URL("./project/page1.ts", import.meta.url);
    const originalData = await Deno.readTextFile(page1ModuleURL);
    await Deno.writeTextFile(page1ModuleURL, `//comment\n${originalData}`);

    await helper.build();

    const secondBuildChache = await helper.cacheExplorer();
    asserts.assertEquals(secondBuildChache.get("/page1/1").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page1/2").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page2/1").age, "old");
    asserts.assertEquals(secondBuildChache.get("/page2/2").age, "old");
});

Deno.test("incremental: files are regenerated if dependency code changes", async () => {
    const helper = new FrugalHelper(config);

    await helper.build();

    // add a comment at the top of store.ts
    const storeModuleURL = new URL("./project/store.ts", import.meta.url);
    const originalData = await Deno.readTextFile(storeModuleURL);
    await Deno.writeTextFile(storeModuleURL, `//comment\n${originalData}`);

    await helper.build();

    const secondBuildChache = await helper.cacheExplorer();
    asserts.assertEquals(secondBuildChache.get("/page1/1").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page1/2").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page2/1").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page2/2").age, "new");
});

Deno.test("incremental: files are regenerated if data changes", async () => {
    const helper = new FrugalHelper(config);

    await helper.build();

    // modify data.json but only data used by page1/1
    const dataURL = new URL("./project/data.json", import.meta.url);
    const originalData = await Deno.readTextFile(dataURL);
    const updatedData = JSON.parse(originalData);
    updatedData[0]["1"] = {
        "data": 110,
    };
    await Deno.writeTextFile(dataURL, JSON.stringify(updatedData, null, 4));

    await helper.build();

    const secondBuildChache = await helper.cacheExplorer();
    asserts.assertEquals(secondBuildChache.get("/page1/1").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page1/2").age, "old");
    asserts.assertEquals(secondBuildChache.get("/page2/1").age, "old");
    asserts.assertEquals(secondBuildChache.get("/page2/2").age, "old");
});

async function setupTestFiles() {
    // clean everything from previous tests
    const base = new URL("./project/", import.meta.url);
    try {
        await Deno.remove(base, { recursive: true });
    } catch {}

    await fs.ensureDir(base);

    const fixtures = new URL("./fixtures/", import.meta.url);

    for await (const entry of Deno.readDir(fixtures)) {
        await fs.copy(new URL(entry.name, fixtures), new URL(entry.name, base));
    }
}

async function loadConfig(): Promise<Config> {
    // load config busting deno cache
    const hash = String(Date.now());
    const { config } = await import(`./project/frugal.config.ts#${hash}`);
    return config;
}
