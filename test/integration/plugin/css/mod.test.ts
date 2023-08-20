import * as asserts from "../../../../dep/std/testing/asserts.ts";
import * as snapshot from "../../../../dep/std/testing/snapshot.ts";
import * as fs from "../../../../dep/std/fs.ts";

import { Config } from "../../../../mod.ts";
import { FrugalHelper } from "../../../utils/FrugalHelper.ts";

if (import.meta.main) {
    const config = await loadConfig();
    FrugalHelper.watch(config);
} else {
    await setupTestFiles();
}

Deno.test("css: build page with css dependencies", async (t) => {
    const config = await loadConfig();
    const helper = new FrugalHelper(config);

    await helper.build();

    const assets = await helper.assets("page.ts");

    asserts.assertEquals(assets.get("style").length, 1);
    const cssURL = new URL(assets.get("style")[0].slice(1), helper.config.publicdir);

    snapshot.assertSnapshot(t, await Deno.readTextFile(cssURL));
});

Deno.test("css: css dependencies are watched", async () => {
    const config = await loadConfig();
    const helper = new FrugalHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt = (await firstBuildCache.get("/page"))?.updatedAt;

    // add a comment at the top of dep.css
    const depModuleURL = new URL("./project/dep.css", import.meta.url);
    const originalData = await Deno.readTextFile(depModuleURL);
    await Deno.writeTextFile(depModuleURL, `/*comment*/\n${originalData}`);

    await context.awaitNextBuild();

    const secondBuildChache = await context.cacheExplorer();
    asserts.assertNotEquals(updatedAt, (await secondBuildChache.get("/page"))?.updatedAt);

    await Deno.writeTextFile(depModuleURL, originalData);

    await context.dispose();
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
