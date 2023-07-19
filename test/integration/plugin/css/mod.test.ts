import * as asserts from "../../../../dep/std/testing/asserts.ts";
import * as path from "../../../../dep/std/path.ts";
import * as snapshot from "../../../../dep/std/testing/snapshot.ts";
import { Config, context } from "../../../../mod.ts";
import { BuildHelper, setupFiles } from "../../../utils.ts";

if (import.meta.main) {
    const config = await loadConfig();
    await context(config).watch();
} else {
    await setupTestFiles();
}

Deno.test("css: build page with css dependencies", async (t) => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    console.log(path.fromFileUrl(helper.config.rootdir));
    const watcher = Deno.watchFs(path.fromFileUrl(helper.config.rootdir), { recursive: true });

    const builderPromise = helper.build().then(() => {
        console.log("build done");
        watcher.close();
    });

    console.log("watch");

    for await (const event of watcher) {
        if (event.paths.some((path) => path.includes("/public/css/"))) {
            console.log(event);
            console.log(await Deno.readTextFile(event.paths[0]));
        }
    }

    snapshot.assertSnapshot(t, await Deno.readTextFile(new URL("css/page.css", helper.config.publicdir)));
});

Deno.test("css: css dependencies are watched", async () => {
    const config = await loadConfig();
    const helper = new BuildHelper(config);

    const context = helper.context();
    context.watch();

    await context.awaitNextBuild();

    const firstBuildCache = await context.cacheExplorer();
    const updatedAt = firstBuildCache.get("/page").updatedAt;

    // add a comment at the top of dep.css
    const depModuleURL = new URL("./project/dep.css", import.meta.url);
    const originalData = await Deno.readTextFile(depModuleURL);
    await Deno.writeTextFile(depModuleURL, `/*comment*/\n${originalData}`);

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
        "./after.css": `.after {
            color: blue;
        }
`,

        //####
        "./after.ts": `import "./after.css";
`,

        //####
        "./before.css": `.before {
            color: blue;
        }
`,

        //####
        "./before.ts": `import "./before.css";
`,

        //####
        "./dep.css": `.dep {
            color: blue;
        }
`,

        //####
        "./main.css": `@import url(./dep.css);

.main {
    color: red;
}
`,

        //####
        "./page.ts": `import "./before.ts";
import "./main.css";
import "./after.ts";
import "https://meyerweb.com/eric/tools/css/reset/reset.css";
import "npm:prismjs@1.29.0/themes/prism.css";

export const pattern = "/page";

export function render() {
    return "";
}
`,

        //####
        "./frugal.config.ts": `import { Config } from "../../../../../mod.ts";
import { css } from "../../../../../plugins/css.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page.ts"],
    plugins: [css()],
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
