import * as frugal from '../mod.ts';
import puppeteer, { Browser } from '../dep/puppeteer.ts';

type Builder = {
    build: () => Promise<frugal.Frugal>;
    clean: () => Promise<void>;
};

export function getBuilder(config: frugal.FrugalConfig): Builder {
    const outdir = `./${crypto.randomUUID()}/`;

    return {
        build: () => frugal.build({ outdir, ...config }),
        clean: async () => {
            try {
                await Deno.remove(new URL(outdir, config.self), {
                    recursive: true,
                });
            } catch {
                /* empty on purpose */
            }
        },
    };
}

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