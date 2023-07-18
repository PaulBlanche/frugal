import * as asserts from "../../../dep/std/testing/asserts.ts";
import { config } from "./frugal.config.ts";

import { BuildHelper, withPage } from "../../utils.ts";
import { importKey, sign } from "../../../src/server/crypto.ts";

Deno.test("server: serving basic static page", async (t) => {
    const helper = new BuildHelper(config);

    await helper.build();

    await t.step("without JIT", async () => {
        await helper.withServer(async () => {
            await withPage(async ({ page }) => {
                const response = await page.goto("http://localhost:8000/static/1");
                const body = await response!.json();

                asserts.assertEquals(response?.headers()["content-type"], "application/json");
                asserts.assertEquals(body, {
                    path: { slug: "1" },
                    count: 0,
                    store: "foo",
                    searchParams: {},
                });
            });
        });
    });

    await t.step("with JIT", async () => {
        await helper.withServer(async () => {
            await withPage(async ({ page }) => {
                const response = await page.goto("http://localhost:8000/static-jit/5");
                const body = await response!.json();

                asserts.assertEquals(response?.headers()["content-type"], "application/json");
                asserts.assertEquals(body, {
                    path: { slug: "5" },
                    count: 0,
                    searchParams: {},
                });
            });
        });
    });

    await t.step("with invalid JIT", async () => {
        await helper.withServer(async () => {
            await withPage(async ({ page }) => {
                const response = await page.goto("http://localhost:8000/static/5");

                asserts.assertEquals(response!.status(), 404);
            });
        });
    });

    await t.step("with force refresh", async () => {
        const timestamp = Date.now();
        const signature = await sign(
            await importKey(
                "eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
            ),
            String(timestamp),
        );

        // modify data.json but only data used by page1/1
        const dataURL = new URL("./data.json", import.meta.url);
        const originalData = await Deno.readTextFile(dataURL);
        await Deno.writeTextFile(dataURL, '"bar"');

        await helper.withServer(async () => {
            await withPage(async ({ page }) => {
                const response = await page.goto(
                    `http://localhost:8000/static/5?timestamp=${timestamp}&sign=${signature}`,
                );
                const body = await response!.json();

                asserts.assertEquals(response?.headers()["content-type"], "application/json");
                asserts.assertEquals(body, {
                    path: { slug: "5" },
                    count: 0,
                    store: "bar",
                    searchParams: {},
                });
            });
        });

        await Deno.writeTextFile(dataURL, originalData);
    });

    await t.step("with invalid method", async () => {
        await helper.withServer(async () => {
            await withPage(async ({ page }) => {
                await page.setRequestInterception(true);

                page.on("request", (interceptedRequest) => {
                    interceptedRequest.continue({
                        "method": "PATCH",
                    });
                });

                const response = await page.goto("http://localhost:8000/static-jit/5");

                asserts.assertEquals(response!.status(), 404);
            });
        });
    });
});

Deno.test("server: serving basic dynamic page", async (t) => {
    const helper = new BuildHelper(config);

    await helper.build();

    await t.step("GET", async () => {
        await helper.withServer(async () => {
            await withPage(async ({ page }) => {
                const response = await page.goto("http://localhost:8000/dynamic/6");
                const body = await response!.json();

                asserts.assertEquals(body, {
                    path: { slug: "6" },
                    count: 0,
                    searchParams: {},
                });

                const responseWithParams = await page.goto("http://localhost:8000/dynamic/3?foo=bar");
                const bodyWithParams = await responseWithParams!.json();

                asserts.assertEquals(bodyWithParams, {
                    path: { slug: "3" },
                    count: 1,
                    searchParams: { foo: "bar" },
                });
            });
        });
    });
});

Deno.test("server: static page with post/redirect", async (t) => {
    const helper = new BuildHelper(config);

    await helper.build();

    await t.step("POST that redirects to GET with forceGenerate", async () => {
        await helper.withServer(async () => {
            await withPage(async ({ page }) => {
                await page.setRequestInterception(true);

                page.on("request", (interceptedRequest) => {
                    interceptedRequest.continue({
                        "method": "POST",
                    });
                });

                const response = await page.goto("http://localhost:8000/static/4?foo=bar");
                const body = await response!.json();

                asserts.assertEquals(body, {
                    path: { slug: "4" },
                    count: 1,
                    store: "foo",
                    searchParams: { foo: "bar" },
                });
            });
        });
    });
});
