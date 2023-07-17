import * as asserts from "../../../dep/std/testing/asserts.ts";
import { Config } from "../../../mod.ts";

import { getHelper } from "../../utils.ts";

const config: Config = {
    self: import.meta.url,
    pages: [],
    log: { level: "silent" },
};

Deno.test("pages: build with no page ", async () => {
    const helper = getHelper({
        ...config,
        pages: [],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    asserts.assertEquals(cache.entries(), []);
});

Deno.test("pages: build with page that do not exists", async () => {
    const helper = getHelper({
        ...config,
        pages: ["./page-that-does-not-exists.ts"],
    });

    await asserts.assertRejects(
        () => helper.build(),
        'file "./page-that-does-not-exists.ts" is not accessible',
    );
});

Deno.test("pages: build with trivial static page", async () => {
    const helper = getHelper({
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
    const helper = getHelper({
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
    const helper = getHelper({
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
    const helper = getHelper({
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
    const helper = getHelper({
        ...config,
        pages: ["./dynamicPage.ts"],
    });

    await helper.build();

    const cache = await helper.cacheExplorer();
    asserts.assertEquals(cache.entries(), []);
});

Deno.test("pages: build pages with non ok responses", async () => {
    const helper = getHelper({
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
    const helper = getHelper({
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
