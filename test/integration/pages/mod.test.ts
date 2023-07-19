import * as asserts from "../../../dep/std/testing/asserts.ts";

import { BuildHelper } from "../../utils.ts";
import { config } from "./frugal.config.ts";

await setupTestFiles();

Deno.test("pages: build with no page ", async () => {
    const helper = new BuildHelper({
        ...config,
        pages: [],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    asserts.assertEquals(cache.entries(), []);
});

Deno.test("pages: build with page that do not exists", async () => {
    const helper = new BuildHelper({
        ...config,
        pages: ["./page-that-does-not-exists.ts"],
    });

    await asserts.assertRejects(
        () => helper.build(),
        'file "./page-that-does-not-exists.ts" is not accessible',
    );
});

Deno.test("pages: build with trivial static page", async () => {
    const helper = new BuildHelper({
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
    const helper = new BuildHelper({
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
    const helper = new BuildHelper({
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
    const helper = new BuildHelper({
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
    const helper = new BuildHelper({
        ...config,
        pages: ["./dynamicPage.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    asserts.assertEquals(cache.entries(), []);
});

Deno.test("pages: build pages with non ok responses", async () => {
    const helper = new BuildHelper({
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
    const helper = new BuildHelper({
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
    const base = new URL("./dist/", import.meta.url);
    try {
        await Deno.remove(base, { recursive: true });
    } catch {}
}
