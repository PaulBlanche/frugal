import * as asserts from "../../../../dep/std/testing/asserts.ts";
import * as snapshot from "../../../../dep/std/testing/snapshot.ts";
import { Config, context } from "../../../../mod.ts";
import { BuildHelper, setupFiles } from "../../../utils.ts";

if (import.meta.main) {
    const config = await loadConfig();
    await context(config).watch();
} else {
    await setupTestFiles();
}

Deno.test("css: build page with css module dependencies", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    await helper.build();

    await new Promise((res) => setTimeout(res, 200));

    snapshot.assertSnapshot(t, await Deno.readTextFile(new URL("css/page.css", helper.config.publicdir)));

    const cache = await helper.cacheExplorer();

    snapshot.assertSnapshot(t, await cache.loadDocument("/page"));
});

Deno.test("css: css module dependencies are watched", async () => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt = firstBuildCache.get("/page").updatedAt;

    // add a comment at the top of dep.css
    const depModuleURL = new URL("./project/dep.module.css", import.meta.url);
    const originalData = await Deno.readTextFile(depModuleURL);
    await Deno.writeTextFile(depModuleURL, `\n${originalData}`);

    await context.awaitNextBuild();

    const secondBuildChache = await context.cacheExplorer();
    asserts.assertNotEquals(updatedAt, secondBuildChache.get("/page").updatedAt);

    await Deno.writeTextFile(depModuleURL, originalData);

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
        "./dep.module.css": `.baz {
    margin: 10px;
}
`,

        //####
        "./main.module.css": `.foo {
    composes: bar;
    color: red;
}

.bar {
    composes: baz from './dep.module.css';
    background: red;
}
`,

        //####
        "./page.ts": `import style from "./main.module.css";

export const pattern = "/page";

export function render() {
    return JSON.stringify(style);
}
`,

        //####
        "./frugal.config.ts": `import { Config } from "../../../../../mod.ts";
import { css } from "../../../../../plugins/css.ts";
import { cssModule } from "../../../../../plugins/cssModule.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page.ts"],
    plugins: [
        cssModule({
            // to avoid hash beeing different on different machines runing the
            // tests
            pattern: "[local]",
        }),
        css(),
    ],
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
