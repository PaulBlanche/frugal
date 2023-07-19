import * as asserts from "../../../dep/std/testing/asserts.ts";
import { Config } from "../../../mod.ts";

import { BuildHelper, setupFiles } from "../../utils.ts";

await setupTestFiles();
const config = await loadConfig();

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
    const helper = new BuildHelper(config);

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
    const helper = new BuildHelper(config);

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
