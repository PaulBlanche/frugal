import * as asserts from "../../../dep/std/testing/asserts.ts";

import { BuildHelper } from "../../utils.ts";
import { config } from "./frugal.config.ts";

Deno.test("incremental", async () => {
    const helper = new BuildHelper(config);

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
    const helper = new BuildHelper(config);

    await helper.build();

    // add a comment at the top of page1.ts
    const page1ModuleURL = new URL("./page1.ts", import.meta.url);
    const originalData = await Deno.readTextFile(page1ModuleURL);
    await Deno.writeTextFile(page1ModuleURL, `//comment\n${originalData}`);

    await helper.build();

    const secondBuildChache = await helper.cacheExplorer();
    asserts.assertEquals(secondBuildChache.get("/page1/1").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page1/2").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page2/1").age, "old");
    asserts.assertEquals(secondBuildChache.get("/page2/2").age, "old");

    await Deno.writeTextFile(page1ModuleURL, originalData);
});

Deno.test("incremental: files are regenerated if dependency code changes", async () => {
    const helper = new BuildHelper(config);

    await helper.build();

    // add a comment at the top of store.ts
    const storeModuleURL = new URL("./store.ts", import.meta.url);
    const originalData = await Deno.readTextFile(storeModuleURL);
    await Deno.writeTextFile(storeModuleURL, `//comment\n${originalData}`);

    await helper.build();

    const secondBuildChache = await helper.cacheExplorer();
    asserts.assertEquals(secondBuildChache.get("/page1/1").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page1/2").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page2/1").age, "new");
    asserts.assertEquals(secondBuildChache.get("/page2/2").age, "new");

    await Deno.writeTextFile(storeModuleURL, originalData);
});

Deno.test("incremental: files are regenerated if data changes", async () => {
    const helper = new BuildHelper(config);

    await helper.build();

    // modify data.json but only data used by page1/1
    const dataURL = new URL("./data.json", import.meta.url);
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

    await Deno.writeTextFile(dataURL, originalData);
});
