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

Deno.test("script: build page with script and css module dependencies", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    await helper.build();

    snapshot.assertSnapshot(t, await Deno.readTextFile(new URL("css/page.css", helper.config.publicdir)));
    snapshot.assertSnapshot(t, await Deno.readTextFile(new URL("js/page.js", helper.config.publicdir)));
});

Deno.test("css: script dependencies are watched", async () => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt = firstBuildCache.get("/page").updatedAt;

    // add a comment at the top of dep.css
    const depModuleURL = new URL("./project/dep.ts", import.meta.url);
    const originalData = await Deno.readTextFile(depModuleURL);
    await Deno.writeTextFile(depModuleURL, `//comment\n${originalData}`);

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
        "./style.module.css": `.foo { color: red; }
`,

        //####
        "./dep1.script.ts": `import "./shared.ts";

if (import.meta.main) {
    console.log("dep1.script.ts")
}
`,

        //####
        "./dep2.script.ts": `import "./shared.ts";

if (import.meta.main) {
    console.log("dep2.script.ts")
}
`,

        //####
        "./dep.ts": `import "./dep1.script.ts";
import "./dep2.script.ts";
`,

        //####
        "./shared.ts": `import 'npm:pad-left@2.1.0';
import 'https://esm.sh/fast-cartesian@8.0.0';
import style from './style.module.css'

// side effect to keep style import
window.style = style
`,

        //####
        "./before.script.ts": `import "./shared.ts";

if (import.meta.main) {
    console.log("before.script.ts")
}
`,

        //####
        "./after.script.ts": `import "./shared.ts";

if (import.meta.main) {
    console.log("after.script.ts")
}
`,

        //####
        "./page.ts": `import "./before.script.ts";
import "./dep.ts";
import "./after.script.ts";

export const pattern = "/page";

export function render() {
    return "";
}
`,

        //####
        "./frugal.config.ts": `import { Config } from "../../../../../mod.ts";
import { script } from "../../../../../plugins/script.ts";
import { cssModule } from "../../../../../plugins/cssModule.ts";
import { css } from "../../../../../plugins/css.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page.ts"],
    plugins: [
        script(), 
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
