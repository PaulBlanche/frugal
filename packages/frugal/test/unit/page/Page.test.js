import { test, mock } from "node:test";
import * as assert from "node:assert/strict";

import * as page from "../../../src/page/Page.js";
import * as pagedescriptor from "../../../src/page/PageDescriptor.js";
import * as response from "../../../src/page/Response.js";
import * as jsonvalue from "../../../src/page/JSONValue.js";

test("#Page: compile error", () => {
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ (
                    {
                        //empty
                    }
                ),
            ),
        "empty descriptor should not compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                }),
            ),
        "descriptor with just route should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                }),
            ),
        "descriptor with route and render should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "foo",
                    render: () => {},
                }),
            ),
        "descriptor with route not starting with / should not compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: true,
                    render: () => {},
                }),
            ),
        "descriptor with nont string route should not compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: "foo",
                }),
            ),
        "descriptor with non function render should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    generate: () => {},
                    render: () => {},
                }),
            ),
        "descriptor with route, generate and render should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    generate: "foo",
                    render: () => {},
                }),
            ),
        "descriptor with non function generate should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    getPaths: () => {},
                    render: () => {},
                }),
            ),
        "descriptor with route, getPaths and render should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    getPaths: "foo",
                    render: () => {},
                }),
            ),
        "descriptor with non function getPaths should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    strictPaths: true,
                    render: () => {},
                }),
            ),
        "descriptor with route, strictPaths and render should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    strictPaths: "foo",
                    render: () => {},
                }),
            ),
        "descriptor with non boolean strictPaths should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    extra: "foo",
                }),
            ),
        "descriptor with extra property should compile",
    );

    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    GET: () => {},
                }),
            ),
        "descriptor with route, render, GET should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    GET: "foo",
                }),
            ),
        "descriptor with non function GET should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    POST: () => {},
                }),
            ),
        "descriptor with route, render, POST should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    POST: "foo",
                }),
            ),
        "descriptor with non function POST should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    PUT: () => {},
                }),
            ),
        "descriptor with route, render, PUT should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    PUT: "foo",
                }),
            ),
        "descriptor with non function PUT should not compile",
    );
    assert.doesNotThrow(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    DELETE: () => {},
                }),
            ),
        "descriptor with route, render, DELETE should compile",
    );
    assert.throws(
        () =>
            page.compile(
                "foo",
                "bar",
                /** @type {any} */ ({
                    route: "/foo",
                    render: () => {},
                    DELETE: "foo",
                }),
            ),
        "descriptor with non function DELETE should not compile",
    );
});

test("#Page: compile type", () => {
    assert.ok(
        page.compile("foo", "bar", {
            route: "/foo",
            render: () => "foo",
        }) instanceof page.StaticPage,
        "descriptor should be compiled as StaticPage by default",
    );
    assert.ok(
        page.compile("foo", "bar", {
            route: "/foo",
            render: () => "foo",
            type: "dynamic",
            GET: () => new response.EmptyResponse({}),
        }) instanceof page.DynamicPage,
        "descriptor with 'dynamic' type should be compiled as DynamicPage",
    );
});

test("#Page: BasePage methods and properties", () => {
    const spyRender = mock.fn(() => "foo");
    const descriptor =
        /** @type {pagedescriptor.StaticPageDescriptor<"/foo/:id", jsonvalue.JSONValue>} */ ({
            route: "/foo/:id",
            render: spyRender,
            POST: () => new response.EmptyResponse({}),
            PUT: () => new response.EmptyResponse({}),
            PATCH: () => new response.EmptyResponse({}),
            DELETE: () => new response.EmptyResponse({}),
        });
    const entrypoint = "foo";
    const moduleHash = "bar";
    const compiledPage = page.compile(entrypoint, moduleHash, descriptor);

    assert.deepEqual(compiledPage.moduleHash, moduleHash, "Page should hold its moduleHash");
    assert.deepEqual(compiledPage.entrypoint, entrypoint, "Page should hold its entrypoint");
    assert.deepEqual(compiledPage.route, descriptor.route, "Page should hold its route");
    assert.deepEqual(compiledPage.POST, descriptor.POST, "Page should hold its POST method");
    assert.deepEqual(compiledPage.PUT, descriptor.PUT, "Page should hold its PUT method");
    assert.deepEqual(compiledPage.PATCH, descriptor.PATCH, "Page should hold its PATCH method");
    assert.deepEqual(compiledPage.DELETE, descriptor.DELETE, "Page should hold its DELETE method");

    const context = /** @type {pagedescriptor.RenderContext<string, jsonvalue.JSONValue>} */ ({});
    compiledPage.render(context);
    assert.deepEqual(spyRender.mock.calls[0].result, "foo");
    assert.deepEqual(spyRender.mock.calls[0].arguments, [context]);

    assert.deepEqual(
        compiledPage.compile({ id: "1" }),
        "/foo/1",
        "page compile should compile pattern with givene parameters",
    );
    assert.throws(() => {
        compiledPage.compile(/** @type {any} */ ({ foo: "1" }));
    }, "page compile should throw for wrong pattern parameters");
});

test("#Page: StaticPage methods and properties", async () => {
    const emptyPage = /** @type {page.StaticPage} */ (
        page.compile("foo", "bar", {
            route: "/foo",
            render: () => "foo",
        })
    );

    assert.deepEqual(emptyPage.strictPaths, true, "strictPaths should default to false");
    assert.deepEqual(
        (await emptyPage.generate(/** @type {any} */ ({}))).data,
        {},
        "generate should default to returning data response with empty object",
    );
    assert.deepEqual(
        emptyPage.getPaths(/** @type {any} */ ({})),
        [{}],
        "getPathList should default to returning an array of one empty object",
    );

    const compiledPage = /** @type {page.StaticPage} */ (
        page.compile("foo", "bar", {
            route: "/foo",
            render: () => "foo",
            strictPaths: false,
            generate: () => new response.DataResponse("foobar"),
            getPaths: () => ["foo", "bar"],
        })
    );

    assert.deepEqual(compiledPage.strictPaths, false, "strictPaths should proxy descriptor");
    assert.deepEqual(
        (await compiledPage.generate(/** @type {any} */ ({}))).data,
        "foobar",
        "generate should proxy descriptor",
    );
    assert.deepEqual(
        compiledPage.getPaths(/** @type {any} */ ({})),
        ["foo", "bar"],
        "getPathList should proxy descriptor",
    );
});

test("#Page: DynamicPage methods and properties", async () => {
    const compiledPage = /** @type {page.DynamicPage} */ (
        page.compile("foo", "bar", {
            route: "/foo",
            render: () => "foo",
            GET: () => new response.DataResponse("foobar"),
        })
    );

    assert.deepEqual(
        (await compiledPage.GET(/** @type {any} */ ({}))).data,
        "foobar",
        "GET should proxy descriptor",
    );
});
