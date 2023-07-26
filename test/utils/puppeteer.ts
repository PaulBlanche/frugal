import puppeteer, { Browser, Page } from "../../dep/puppeteer/mod.ts";

type WithBrowserOptions = {
    onClose?: () => Promise<void> | void;
};

export async function withBrowser(
    callback: (browser: Browser) => Promise<void>,
    options: WithBrowserOptions = {},
) {
    const browser = await puppeteer.launch();
    try {
        await callback(browser);
    } finally {
        await options?.onClose?.();
        await browser.close();
    }
}

export type WithPageCallbackParams = {
    browser: Browser;
    page: Page;
};

export async function withPage(
    callback: ({ browser, page }: WithPageCallbackParams) => Promise<void>,
    options: WithBrowserOptions = {},
) {
    return withBrowser(async (browser) => {
        const page = await browser.newPage();
        try {
            await callback({ browser, page });
        } finally {
            await page.close();
        }
    }, options);
}

export async function addPageEventListener<SELECTED>(
    event: string,
    callback: (event: SELECTED) => void,
    page: Page,
    config?: {
        functionName?: string;
        selector?: string;
        onNewDocument?: boolean;
    },
) {
    const functionName = config?.functionName ?? `listener_${String(Math.random()).slice(2)}`;

    const selector = config?.selector ?? "() => {}";

    const toEvaluate = `
        const selector_${functionName} = ${selector.toString()}
        addEventListener("${event}", (event) => ${functionName}(selector_${functionName}(event)))
    `;

    await page.exposeFunction(functionName, (selected: any) => callback(selected));

    if (config?.onNewDocument) {
        await page.evaluateOnNewDocument(toEvaluate);
    } else {
        await page.evaluate(toEvaluate);
    }
}

export function pageEventPromise(
    event: string,
    page: Page,
    config?: { filter?: string; functionName?: string; onNewDocument?: boolean },
) {
    const functionName = config?.functionName ?? `eventpromise_${String(Math.random()).slice(2)}`;

    const selector = config?.filter ?? "() => true";

    const toEvaluate = `
        const filter_${functionName} = ${selector.toString()}
        addEventListener("${event}", (event) => filter_${functionName}(event) && ${functionName}())
    `;

    return new Promise<void>((res) => {
        page.exposeFunction(functionName, res);

        if (config?.onNewDocument) {
            page.evaluateOnNewDocument(toEvaluate);
        } else {
            page.evaluate(toEvaluate);
        }
    });
}
