import * as asserts from "../../../dep/std/testing/asserts.ts";
import * as fs from "../../../dep/std/fs.ts";

import { FrugalHelper } from "../../utils/FrugalHelper.ts";
import { Config } from "../../../mod.ts";

await setupTestFiles();
const config = await loadConfig();

Deno.test("pages: build with no page ", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: [],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    asserts.assertEquals(cache.entries(), []);
});

Deno.test("pages: build with page that do not exists", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./page-that-does-not-exists.ts"],
    });

    await asserts.assertRejects(
        () => helper.build(),
        'file "./page-that-does-not-exists.ts" is not accessible',
    );
});

Deno.test("pages: build with trivial static page", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./trivialPage.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    await cache.assertContent([["/", {
        path: "/",
        body: "Hello world",
        headers: [],
        age: "new",
    }]]);
});

Deno.test("pages: build with trivial static page with getData", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./trivialPageWithGetData.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    await cache.assertContent([["/", {
        path: "/",
        status: 204,
        body: "bar",
        headers: [["my-header", "quux"]],
        age: "new",
    }]]);
});

Deno.test("pages: build with trivial static page with getPathList", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./trivialPageWithGetPathList.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    await cache.assertContent([["/foo/bar", {
        path: "/foo/bar",
        headers: [],
        body: "Hello world",
        age: "new",
    }], ["/fooz/baz", {
        path: "/fooz/baz",
        headers: [],
        body: "Hello world",
        age: "new",
    }]]);
});

Deno.test("pages: build complete static page", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./completePage.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    await cache.assertContent([["/bar", {
        path: "/bar",
        status: 202,
        body: "data: Hello bar",
        headers: [["x-foo", "bar"]],
        age: "new",
    }], ["/foo", {
        path: "/foo",
        status: 201,
        body: "data: Hello foo",
        headers: [["x-foo", "foo"]],
        age: "new",
    }]]);
});

Deno.test("pages: build dynamic page", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./dynamicPage.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    asserts.assertEquals(cache.entries(), []);
});

Deno.test("pages: build pages with non ok responses", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./pageWithNonOkResponse.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    await cache.assertContent([["/", {
        path: "/",
        status: 405,
        body: "bar",
        headers: [["my-header", "quux"]],
        age: "new",
    }]]);
});

Deno.test("pages: build pages with empty responses", async () => {
    const helper = new FrugalHelper({
        ...config,
        pages: ["./pageWithEmptyResponse.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    await cache.assertContent([["/", {
        path: "/",
        headers: [["my-header", "quux"]],
        body: undefined,
        age: "new",
    }]]);
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
