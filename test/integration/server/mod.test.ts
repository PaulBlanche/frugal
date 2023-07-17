import * as asserts from "../../../dep/std/testing/asserts.ts";
import { Config } from "../../../mod.ts";
import { MemorySessionStorage } from "../../../src/server/session/MemorySessionStorage.ts";

import { getHelper } from "../../utils.ts";

const config: Config = {
    self: import.meta.url,
    pages: ["./dynamicPage.ts", "./staticPage.ts"],
    log: { level: "silent" },
    server: {
        session: {
            storage: new MemorySessionStorage(),
        },
    },
};

Deno.test("server ", async (t) => {
    const fetch = cookieFetch();

    const helper = getHelper(config);

    await helper.build();

    await new Promise((res) => setTimeout(res, 0));

    await t.step("serve basic dynamic page with session", async (t) => {
        await t.step("simple GET", async () => {
            const controller = new AbortController();
            await helper.serve(controller.signal);

            const response1 = await fetch("http://localhost:8000/dynamic/1");
            const result1 = await response1.json();
            asserts.assertEquals(result1, {
                path: { slug: "1" },
                count: 0,
                searchParams: {},
            });
            const headers1 = Object.fromEntries(response1.headers.entries());
            asserts.assertEquals(headers1["content-type"], "application/json");

            controller.abort();
        });

        await t.step("GET with query params", async () => {
            const controller = new AbortController();
            await helper.serve(controller.signal);

            const response2 = await fetch("http://localhost:8000/dynamic/2?foo=bar");
            const result2 = await response2.json();
            asserts.assertEquals(result2, {
                path: { slug: "2" },
                count: 1,
                searchParams: { foo: "bar" },
            });

            controller.abort();
        });
    });

    await t.step("serve static page with post/redirect", async (t) => {
        await t.step("simple GET", async () => {
            const controller = new AbortController();
            await helper.serve(controller.signal);

            const response = await fetch("http://localhost:8000/static/1");
            const result = await response.json();
            asserts.assertEquals(result, {
                path: { slug: "1" },
                count: 0,
                searchParams: {},
            });
            const headers1 = Object.fromEntries(response.headers.entries());
            asserts.assertEquals(headers1["content-type"], "application/json");

            controller.abort();
        });

        await t.step("GET with query params", async () => {
            const controller = new AbortController();
            await helper.serve(controller.signal);

            const response = await fetch("http://localhost:8000/static/1?foo=bar");
            const result = await response.json();
            asserts.assertEquals(result, {
                path: { slug: "1" },
                count: 0,
                searchParams: {},
            });

            controller.abort();
        });

        await t.step("POST static page", async () => {
            const controller = new AbortController();
            await helper.serve(controller.signal);

            const response = await fetch("http://localhost:8000/static/1?foo=bar", {
                method: "POST",
            });
            const result = await response.json();
            asserts.assertEquals(result, {
                path: { slug: "1" },
                count: 3,
                searchParams: { foo: "bar" },
            });

            controller.abort();
        });
    });
});

function cookieFetch(): typeof fetch {
    const cookies: Record<string, string> = {};

    const rawFetch: typeof fetch = async (input, init) => {
        const headers = new Headers(init?.headers);
        const cookie = Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join(";");
        const currentCookie = headers.get("cookie");
        headers.set(
            "cookie",
            currentCookie ? `${currentCookie};${cookie}` : cookie,
        );

        const response = await fetch(input, {
            ...init,
            headers,
            redirect: "manual",
        });

        for (const [name, value] of response.headers.entries()) {
            if (name === "set-cookie") {
                const [name, cookieValue] = value.split(";")[0].split("=");
                cookies[name] = cookieValue;
            }
        }

        return response;
    };

    return async (input, init) => {
        let response = await rawFetch(input, init);

        const location = response.headers.get("location");

        while (response.status >= 300 && response.status < 400 && location) {
            await response.body?.cancel();

            const changeToGet = response.status === 303 ||
                ((response.status === 301 || response.status === 302) &&
                    init?.method === "POST");

            const nextInit = changeToGet
                ? {
                    ...init,
                    method: "GET",
                    body: undefined,
                }
                : init;

            response = await rawFetch(location, nextInit);
        }

        return response;
    };
}
