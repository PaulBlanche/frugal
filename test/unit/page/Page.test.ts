import * as asserts from "../../../dep/std/testing/asserts.ts";
import * as mock from "../../../dep/std/testing/mock.ts";

import { DataResponse, RenderContext, StaticPageDescriptor } from "../../../mod.ts";
import { JSONValue } from "../../../src/page/JSONValue.ts";
import { compile, DynamicPage, StaticPage } from "../../../src/page/Page.ts";
import { EmptyResponse } from "../../../src/page/Response.ts";

Deno.test("test", () => {
});

Deno.test("page: compile error", () => {
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            //empty
        } as any), "empty descriptor should not compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
        } as any), "descriptor with just route should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
        } as any), "descriptor with route and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "foo",
            render: () => {},
        } as any), "descriptor with route not starting with / should not compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: true,
            render: () => {},
        } as any), "descriptor with nont string route should not compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: "foo",
        } as any), "descriptor with non function render should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            generate: () => {},
            render: () => {},
        } as any), "descriptor with route, generate and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            generate: "foo",
            render: () => {},
        } as any), "descriptor with non function generate should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            getPaths: () => {},
            render: () => {},
        } as any), "descriptor with route, getPaths and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            getPaths: "foo",
            render: () => {},
        } as any), "descriptor with non function getPaths should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            strictPaths: true,
            render: () => {},
        } as any), "descriptor with route, strictPaths and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            strictPaths: "foo",
            render: () => {},
        } as any), "descriptor with non boolean strictPaths should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            extra: "foo",
        } as any), "descriptor with extra property should compile");

    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            GET: () => {},
        } as any), "descriptor with route, render, GET should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            GET: "foo",
        } as any), "descriptor with non function GET should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            POST: () => {},
        } as any), "descriptor with route, render, POST should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            POST: "foo",
        } as any), "descriptor with non function POST should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            PUT: () => {},
        } as any), "descriptor with route, render, PUT should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            PUT: "foo",
        } as any), "descriptor with non function PUT should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            DELETE: () => {},
        } as any), "descriptor with route, render, DELETE should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            route: "/foo",
            render: () => {},
            DELETE: "foo",
        } as any), "descriptor with non function DELETE should not compile");
});

Deno.test("page: compile type", () => {
    asserts.assertInstanceOf(
        compile("foo", "bar", {
            route: "/foo",
            render: () => "foo",
        }),
        StaticPage,
        "descriptor should be compiled as StaticPage by default",
    );
    asserts.assertInstanceOf(
        compile("foo", "bar", {
            route: "/foo",
            render: () => "foo",
            type: "dynamic",
            GET: () => new EmptyResponse({}),
        }),
        DynamicPage,
        "descriptor with 'dynamic' type should be compiled as DynamicPage",
    );
});

Deno.test("page: BasePage methods and properties", () => {
    const spyRender = mock.spy(() => "foo");
    const descriptor: StaticPageDescriptor<"/foo/:id", JSONValue> = {
        route: "/foo/:id",
        render: spyRender,
        POST: () => new EmptyResponse({}),
        PUT: () => new EmptyResponse({}),
        PATCH: () => new EmptyResponse({}),
        DELETE: () => new EmptyResponse({}),
    };
    const entrypoint = "foo";
    const moduleHash = "bar";
    const page = compile(entrypoint, moduleHash, descriptor);

    asserts.assertEquals(page.moduleHash, moduleHash, "Page should hold its moduleHash");
    asserts.assertEquals(page.entrypoint, entrypoint, "Page should hold its entrypoint");
    asserts.assertEquals(page.route, descriptor.route, "Page should hold its route");
    asserts.assertEquals(page.POST, descriptor.POST, "Page should hold its POST method");
    asserts.assertEquals(page.PUT, descriptor.PUT, "Page should hold its PUT method");
    asserts.assertEquals(page.PATCH, descriptor.PATCH, "Page should hold its PATCH method");
    asserts.assertEquals(page.DELETE, descriptor.DELETE, "Page should hold its DELETE method");

    const context = {} as RenderContext<string, JSONValue>;
    page.render(context);
    mock.assertSpyCall(spyRender, 0, { returned: "foo", args: [context] });

    asserts.assertEquals(
        page.compile({ id: "1" }),
        "/foo/1",
        "page compile should compile pattern with givene parameters",
    );
    asserts.assertThrows(() => {
        page.compile({ foo: "1" } as any);
    }, "page compile should throw for wrong pattern parameters");
});

Deno.test("page: StaticPage methods and properties", async () => {
    const emptyPage = compile("foo", "bar", {
        route: "/foo",
        render: () => "foo",
    }) as StaticPage;

    asserts.assertEquals(emptyPage.strictPaths, true, "strictPaths should default to false");
    asserts.assertEquals(
        (await emptyPage.generate({} as any)).data,
        {},
        "generate should default to returning data response with empty object",
    );
    asserts.assertEquals(
        emptyPage.getPaths({} as any),
        [{}],
        "getPathList should default to returning an array of one empty object",
    );

    const page = compile("foo", "bar", {
        route: "/foo",
        render: () => "foo",
        strictPaths: false,
        generate: () => new DataResponse("foobar"),
        getPaths: () => ["foo", "bar"],
    }) as StaticPage;

    asserts.assertEquals(page.strictPaths, false, "strictPaths should proxy descriptor");
    asserts.assertEquals(
        (await page.generate({} as any)).data,
        "foobar",
        "generate should proxy descriptor",
    );
    asserts.assertEquals(
        page.getPaths({} as any),
        ["foo", "bar"],
        "getPathList should proxy descriptor",
    );
});

Deno.test("page: DynamicPage methods and properties", async () => {
    const page = compile("foo", "bar", {
        route: "/foo",
        render: () => "foo",
        GET: () => new DataResponse("foobar"),
    }) as DynamicPage;

    asserts.assertEquals(
        (await page.GET({} as any)).data,
        "foobar",
        "GET should proxy descriptor",
    );
});

export function assertNotThrows(fn: () => unknown, msg?: string): void {
    try {
        fn();
    } catch (error) {
        throw new Error(msg ?? "Expected function to no throw", { cause: error });
    }
}
