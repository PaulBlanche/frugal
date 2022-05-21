import {
    Config,
    Frugal,
    OFF_LOGGER_CONFIG,
    page,
} from '../../../packages/core/mod.ts';
import * as path from '../../../dep/std/path.ts';
import { Hash } from '../../../packages/murmur/mod.ts';
import { StyleLoader } from '../../../packages/loader_style/mod.ts';
import { assertSnapshot } from '../../../dep/std/snapshot.ts';

import * as myPage from './page.ts';

Deno.test('style_loader: file structure', async (t) => {
    const config = {
        outputDir: dist(),
        loaders: [
            new StyleLoader({
                test: (url) => {
                    return url.toString().endsWith('.style.ts');
                },
            }),
        ],
        pages: [
            page(myPage),
        ],
    };

    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const pageHtml = await Deno.readTextFile(
        publicFileUrl(frugal, 'index.html'),
    );

    await assertSnapshot(t, pageHtml);

    await frugal.clean();
});

async function getFrugalInstance(
    config: Pick<Config, 'pages' | 'outputDir' | 'loaders'>,
) {
    const frugal = await Frugal.build({
        self: new URL(import.meta.url),
        outputDir: config.outputDir,
        pages: config.pages,
        loaders: config.loaders,
        logging: OFF_LOGGER_CONFIG,
    });

    return frugal;
}

function dist() {
    return `./dist-${new Hash().update(String(Math.random())).digest()}`;
}

function relativeUrl(file: string) {
    return new URL(file, import.meta.url);
}

function publicFileUrl(frugal: Frugal, file: string) {
    return relativeUrl(
        path.join(frugal.config.publicDir, file),
    );
}
