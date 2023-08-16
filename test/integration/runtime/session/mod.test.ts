import * as asserts from "../../../../dep/std/testing/asserts.ts";
import * as mock from "../../../../dep/std/testing/mock.ts";
import * as fs from "../../../../dep/std/fs.ts";

import { Config, context } from "../../../../mod.ts";
import { FrugalHelper } from "../../../utils/FrugalHelper.ts";
import * as puppeteer from "../../../utils/puppeteer.ts";

if (import.meta.main) {
    const config = await loadConfig();
    await context(config).watch();
} else {
    await setupTestFiles();
}

Deno.test("session: navigation should be intercepted by session", async (t) => {
    await withTestPage(async ({ page }) => {
        // setup spies
        const beforeUnloadSpy = mock.spy();
        const frugalBeforeUnloadSpy = mock.spy();
        const frugalReadyStateChangeSpy = mock.spy();

        await puppeteer.addPageEventListener("beforeunload", beforeUnloadSpy, page, { onNewDocument: true });
        await puppeteer.addPageEventListener("frugal:beforeunload", frugalBeforeUnloadSpy, page, {
            onNewDocument: true,
        });
        await puppeteer.addPageEventListener("frugal:readystatechange", frugalReadyStateChangeSpy, page, {
            onNewDocument: true,
            selector: "(event) => event.detail.readystate",
        });

        const sessionStartPromise = puppeteer.pageEventPromise("frugal:sessionstart", page, { onNewDocument: true });

        await page.goto("http://localhost:8000/page1");

        await withTimeout(sessionStartPromise, "session should start");
        await page.evaluate('var foo = "foo"');

        await t.step("forward navigation", async () => {
            const link = await page.waitForSelector("a");
            await link?.click();
            await page.waitForNavigation({
                waitUntil: "networkidle0",
            });

            // page was not unloaded
            mock.assertSpyCalls(beforeUnloadSpy, 0);

            // but all session event are called
            mock.assertSpyCalls(frugalBeforeUnloadSpy, 1);
            mock.assertSpyCall(frugalReadyStateChangeSpy, 0, { args: ["loading"] });
            mock.assertSpyCall(frugalReadyStateChangeSpy, 1, { args: ["interactive"] });
            mock.assertSpyCall(frugalReadyStateChangeSpy, 2, { args: ["complete"] });

            // the url was modified
            asserts.assertEquals(page.url(), "http://localhost:8000/page2");
            // the content was modified
            asserts.assertEquals(await page.title(), "page 2");
            // the javascript context was preserved
            asserts.assertEquals(await page.evaluate("foo"), "foo");
        });

        await t.step("backward navigation", async () => {
            await Promise.all([
                puppeteer.pageEventPromise(
                    "frugal:readystatechange",
                    page,
                    {
                        filter: "(event) => event.detail.readystate === 'complete'",
                    },
                ),
                page.goBack({
                    waitUntil: "networkidle0",
                }),
            ]);

            // the url was modified
            asserts.assertEquals(page.url(), "http://localhost:8000/page1");
            // the content was modified
            asserts.assertEquals(await page.title(), "page 1");
            // the javascript context was preserved
            asserts.assertEquals(await page.evaluate("foo"), "foo");
        });
    });
});

Deno.test("session: nested navigation element", async (t) => {
    await withTestPage(async ({ page }) => {
        // setup spies
        const beforeUnloadSpy = mock.spy();
        const frugalReadyStateChangeSpy = mock.spy();

        await puppeteer.addPageEventListener("beforeunload", beforeUnloadSpy, page, { onNewDocument: true });
        await puppeteer.addPageEventListener("frugal:readystatechange", frugalReadyStateChangeSpy, page, {
            onNewDocument: true,
            selector: "(event) => event.detail.readystate",
        });

        // setup promises for test flow
        const sessionStartPromise = puppeteer.pageEventPromise("frugal:sessionstart", page, { onNewDocument: true });

        await page.goto("http://localhost:8000/page3", {
            waitUntil: "networkidle0",
        });
        await withTimeout(sessionStartPromise, "session should start");

        const link = await page.waitForSelector(".nested");
        await link?.click();
        await page.waitForNavigation();

        mock.assertSpyCalls(beforeUnloadSpy, 0);
        mock.assertSpyCall(frugalReadyStateChangeSpy, 0, { args: ["loading"] });
        mock.assertSpyCall(frugalReadyStateChangeSpy, 1, { args: ["interactive"] });
        mock.assertSpyCall(frugalReadyStateChangeSpy, 2, { args: ["complete"] });
    });
});

Deno.test("session: external navigation element", async (t) => {
    await withTestPage(async ({ page }) => {
        // setup spies
        const beforeUnloadSpy = mock.spy();
        const frugalReadyStateChangeSpy = mock.spy();

        await puppeteer.addPageEventListener("beforeunload", beforeUnloadSpy, page, { onNewDocument: true });
        await puppeteer.addPageEventListener("frugal:readystatechange", frugalReadyStateChangeSpy, page, {
            onNewDocument: true,
            selector: "(event) => event.detail.readystate",
        });

        // setup promises for test flow
        const sessionStartPromise = puppeteer.pageEventPromise("frugal:sessionstart", page, { onNewDocument: true });

        await page.goto("http://localhost:8000/page3", {
            waitUntil: "networkidle0",
        });

        await withTimeout(sessionStartPromise, "session should start");

        const link = await page.waitForSelector(".external");

        await link?.click();
        await page.waitForNavigation();

        mock.assertSpyCalls(beforeUnloadSpy, 1);
        mock.assertSpyCalls(frugalReadyStateChangeSpy, 0);
    });
});

Deno.test("session: disabled navigation element", async (t) => {
    await withTestPage(async ({ page }) => {
        // setup spies
        const beforeUnloadSpy = mock.spy();
        const frugalReadyStateChangeSpy = mock.spy();

        await puppeteer.addPageEventListener("beforeunload", beforeUnloadSpy, page, { onNewDocument: true });
        await puppeteer.addPageEventListener("frugal:readystatechange", frugalReadyStateChangeSpy, page, {
            onNewDocument: true,
            selector: "(event) => event.detail.readystate",
        });

        // setup promises for test flow
        const sessionStartPromise = puppeteer.pageEventPromise("frugal:sessionstart", page, { onNewDocument: true });

        await page.goto("http://localhost:8000/page3", {
            waitUntil: "networkidle0",
        });
        await withTimeout(sessionStartPromise, "session should start");

        const link = await page.waitForSelector(".disabled");
        await link?.click();
        await page.waitForNavigation();

        mock.assertSpyCalls(beforeUnloadSpy, 1);
        mock.assertSpyCalls(frugalReadyStateChangeSpy, 0);
    });
});

Deno.test("session: remote-disabled navigation element", async (t) => {
    await withTestPage(async ({ page }) => {
        // setup spies
        const beforeUnloadSpy = mock.spy();
        const frugalReadyStateChangeSpy = mock.spy();

        await puppeteer.addPageEventListener("beforeunload", beforeUnloadSpy, page, { onNewDocument: true });
        await puppeteer.addPageEventListener("frugal:readystatechange", frugalReadyStateChangeSpy, page, {
            onNewDocument: true,
            selector: "(event) => event.detail.readystate",
        });

        // setup promises for test flow
        const sessionStartPromise = puppeteer.pageEventPromise("frugal:sessionstart", page, { onNewDocument: true });

        await page.goto("http://localhost:8000/page3", {
            waitUntil: "networkidle0",
        });
        await withTimeout(sessionStartPromise, "session should start");

        const link = await page.waitForSelector(".remote-disabled");
        await link?.click();
        await page.waitForNavigation();

        mock.assertSpyCalls(beforeUnloadSpy, 1);
        mock.assertSpyCall(frugalReadyStateChangeSpy, 0, { args: ["loading"] });
    });
});

async function withTimeout<VALUE>(promise: Promise<VALUE>, message: string): Promise<VALUE> {
    const timeout = setTimeout(() => {
        throw Error(message);
    }, 1000);

    promise.then(() => {
        clearTimeout(timeout);
    });

    return promise;
}

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

async function withTestPage(callback: (params: puppeteer.WithPageCallbackParams) => Promise<void>) {
    const config = await loadConfig();
    const helper = new FrugalHelper(config);

    await helper.build();

    await helper.withServer(async () => {
        await puppeteer.withPage(callback);
    });
}
