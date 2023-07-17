import * as asserts from "../../../dep/std/testing/asserts.ts";
import * as mock from "../../../dep/std/testing/mock.ts";

import { DataResponse, RenderContext, StaticPageDescriptor } from "../../../page.ts";
import { JSONValue } from "../../../src/page/JSONValue.ts";
import { compile, DynamicPage, StaticPage } from "../../../src/page/Page.ts";

Deno.test("test", () => {
});

Deno.test("page: compile error", () => {
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            //empty
        } as any), "empty descriptor should not compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
        } as any), "descriptor with just pattern should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
        } as any), "descriptor with pattern and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "foo",
            render: () => {},
        } as any), "descriptor with pattern not starting with / should not compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: true,
            render: () => {},
        } as any), "descriptor with nont string pattern should not compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: "foo",
        } as any), "descriptor with non function render should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            generate: () => {},
            render: () => {},
        } as any), "descriptor with pattern, generate and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            generate: "foo",
            render: () => {},
        } as any), "descriptor with non function generate should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            getPaths: () => {},
            render: () => {},
        } as any), "descriptor with pattern, getPaths and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            getPaths: "foo",
            render: () => {},
        } as any), "descriptor with non function getPaths should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            strictPaths: true,
            render: () => {},
        } as any), "descriptor with pattern, strictPaths and render should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            strictPaths: "foo",
            render: () => {},
        } as any), "descriptor with non boolean strictPaths should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            extra: "foo",
        } as any), "descriptor with extra property should compile");

    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            GET: () => {},
        } as any), "descriptor with pattern, render, GET should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            GET: "foo",
        } as any), "descriptor with non function GET should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            POST: () => {},
        } as any), "descriptor with pattern, render, POST should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            POST: "foo",
        } as any), "descriptor with non function POST should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            PUT: () => {},
        } as any), "descriptor with pattern, render, PUT should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            PUT: "foo",
        } as any), "descriptor with non function PUT should not compile");
    assertNotThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            DELETE: () => {},
        } as any), "descriptor with pattern, render, DELETE should compile");
    asserts.assertThrows(() =>
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => {},
            DELETE: "foo",
        } as any), "descriptor with non function DELETE should not compile");
});

Deno.test("page: compile type", () => {
    asserts.assertInstanceOf(
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => "foo",
        }),
        StaticPage,
        "descriptor should be compiled as StaticPage by default",
    );
    asserts.assertInstanceOf(
        compile("foo", "bar", {
            pattern: "/foo",
            render: () => "foo",
            type: "dynamic",
            GET: () => new DataResponse({}),
        }),
        DynamicPage,
        "descriptor with 'dynamic' type should be compiled as DynamicPage",
    );
});

Deno.test("page: BasePage methods and properties", () => {
    const spyRender = mock.spy(() => "foo");
    const descriptor: StaticPageDescriptor<"/foo/:id", JSONValue> = {
        pattern: "/foo/:id",
        render: spyRender,
        POST: () => new DataResponse({}),
        PUT: () => new DataResponse({}),
        PATCH: () => new DataResponse({}),
        DELETE: () => new DataResponse({}),
    };
    const entrypoint = "foo";
    const moduleHash = "bar";
    const page = compile(entrypoint, moduleHash, descriptor);

    asserts.assertEquals(page.moduleHash, moduleHash, "Page should hold its moduleHash");
    asserts.assertEquals(page.entrypoint, entrypoint, "Page should hold its entrypoint");
    asserts.assertEquals(page.pattern, descriptor.pattern, "Page should hold its pattern");
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
        pattern: "/foo",
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
        pattern: "/foo",
        render: () => "foo",
        strictPaths: false,
        generate: () => new DataResponse({ data: "foobar" }),
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
        pattern: "/foo",
        render: () => "foo",
        GET: () => new DataResponse({ data: "foobar" }),
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
