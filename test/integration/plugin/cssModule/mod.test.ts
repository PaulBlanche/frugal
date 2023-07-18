import * as asserts from "../../../../dep/std/testing/asserts.ts";
import * as snapshot from "../../../../dep/std/testing/snapshot.ts";
import { context } from "../../../../mod.ts";
import { BuildHelper } from "../../../utils.ts";

import { config } from "./frugal.config.ts";

if (import.meta.main) {
    await context(config).watch();
}

Deno.test("css: build page with css module dependencies", async (t) => {
    const helper = new BuildHelper(config);

    await helper.build();

    await new Promise((res) => setTimeout(res, 200));

    snapshot.assertSnapshot(t, await Deno.readTextFile(new URL("css/page.css", helper.config.publicdir)));

    const cache = await helper.cacheExplorer();

    snapshot.assertSnapshot(t, await cache.loadDocument("/page"));
});

Deno.test("css: css module dependencies are watched", async () => {
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt = firstBuildCache.get("/page").updatedAt;

    // add a comment at the top of dep.css
    const depModuleURL = new URL("./dep.module.css", import.meta.url);
    const originalData = await Deno.readTextFile(depModuleURL);
    await Deno.writeTextFile(depModuleURL, `\n${originalData}`);

    await context.awaitNextBuild();

    const secondBuildChache = await context.cacheExplorer();
    asserts.assertNotEquals(updatedAt, secondBuildChache.get("/page").updatedAt);

    await Deno.writeTextFile(depModuleURL, originalData);

    await context.dispose();
});
