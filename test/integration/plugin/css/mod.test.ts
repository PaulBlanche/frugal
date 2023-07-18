import * as asserts from "../../../../dep/std/testing/asserts.ts";
import * as snapshot from "../../../../dep/std/testing/snapshot.ts";
import { context } from "../../../../mod.ts";
import { BuildHelper } from "../../../utils.ts";

import { config } from "./frugal.config.ts";

if (import.meta.main) {
    await context(config).watch();
}

Deno.test("css: build page with css dependencies", async (t) => {
    const helper = new BuildHelper(config);

    await helper.build();

    snapshot.assertSnapshot(t, await Deno.readTextFile(new URL("css/page.css", helper.config.publicdir)));
});

Deno.test("css: css dependencies are watched", async () => {
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt = firstBuildCache.get("/page").updatedAt;

    // add a comment at the top of dep.css
    const depModuleURL = new URL("./dep.css", import.meta.url);
    const originalData = await Deno.readTextFile(depModuleURL);
    await Deno.writeTextFile(depModuleURL, `/*comment*/\n${originalData}`);

    await context.awaitNextBuild();

    const secondBuildChache = await context.cacheExplorer();
    asserts.assertNotEquals(updatedAt, secondBuildChache.get("/page").updatedAt);

    await Deno.writeTextFile(depModuleURL, originalData);

    await context.dispose();
});
