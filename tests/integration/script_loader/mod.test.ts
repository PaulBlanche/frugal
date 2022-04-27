import {
    Config,
    Frugal,
    OFF_LOGGER_CONFIG,
    page,
} from '../../../packages/core/mod.ts';
import * as path from '../../../dep/std/path.ts';
import * as asserts from '../../../dep/std/asserts.ts';
import { Hash } from '../../../packages/murmur/mod.ts';
import { script } from '../../../packages/loader_script/mod.ts';
import { DOMParser } from '../../../dep/dom.ts';
import { assertSnapshot } from '../../../dep/std/snapshot.ts';

import * as pageFoo from './page-foo.ts';
import * as pageBar from './page-bar.ts';

Deno.test('script_loader: file structure', async (t) => {
    const config = {
        outputDir: dist(),
        loaders: [
            script({
                bundles: [{
                    name: 'body',
                    test: (url) => {
                        return url.toString().endsWith('.script.ts');
                    },
                }],
                /* Esbuild will inline full path of each bundled file. Since
                this path contains a random string from the `dist` folder, this
                made the snapshot testing fail. The minification removes those
                comments */
                minify: true,
                format: 'esm',
            }),
        ],
        pages: [
            page(pageFoo),
            page(pageBar),
        ],
    };

    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const pageFoo1 = await Deno.readTextFile(
        publicFileUrl(frugal, 'foo/1.html'),
    );
    const pageFoo2 = await Deno.readTextFile(
        publicFileUrl(frugal, 'foo/2.html'),
    );

    const pageBar1 = await Deno.readTextFile(
        publicFileUrl(frugal, 'bar/1.html'),
    );
    const pageBar2 = await Deno.readTextFile(
        publicFileUrl(frugal, 'bar/2.html'),
    );

    // assert file content
    await assertSnapshot(t, pageFoo1);
    await assertSnapshot(t, pageFoo2);
    await assertSnapshot(t, pageBar1);
    await assertSnapshot(t, pageBar2);

    await frugal.clean();
});

Deno.test('script_loader: script execution and order', async (t) => {
    const config = {
        outputDir: dist(),
        loaders: [
            script({
                bundles: [{
                    name: 'body',
                    test: (url) => {
                        return url.toString().endsWith('.script.ts');
                    },
                }],
                minify: true,
                format: 'esm',
            }),
        ],
        pages: [
            page(pageFoo),
            page(pageBar),
        ],
    };

    const frugal = await getFrugalInstance(config);

    await frugal.build();

    await t.step('page foo script execution and order', async () => {
        const pageFoo1 = await Deno.readTextFile(
            publicFileUrl(frugal, 'foo/1.html'),
        );

        const [_, scriptSrc] = pageFoo1.match(
            /<script type="module" src="(.*)"><\/script>/,
        )!;

        window.document = new DOMParser().parseFromString(
            pageFoo1,
            'text/html',
        ) as any;

        await import(path.join(frugal.config.publicDir, scriptSrc));

        const logText = document.getElementById('log')!.textContent;

        asserts.assertEquals(logText, 'foocomponentshared');
    });

    await t.step('page bar script execution and order', async () => {
        const pageBar1 = await Deno.readTextFile(
            publicFileUrl(frugal, 'bar/1.html'),
        );

        const [_, scriptSrc] = pageBar1.match(
            /<script type="module" src="(.*)"><\/script>/,
        )!;

        window.document = new DOMParser().parseFromString(
            pageBar1,
            'text/html',
        ) as any;

        await import(path.join(frugal.config.publicDir, scriptSrc));

        const logText = document.getElementById('log')!.textContent;

        asserts.assertEquals(logText, 'sharedbarcomponent');
    });

    await frugal.clean();
});

async function getFrugalInstance(
    config: Pick<Config, 'pages' | 'outputDir' | 'loaders'>,
) {
    console.log(import.meta.url, new URL(import.meta.url));
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
    return `./dist-${new Hash().update(String(Math.random())).alphabetic()}`;
}

function relativeUrl(file: string) {
    return new URL(file, import.meta.url);
}

function publicFileUrl(frugal: Frugal, file: string) {
    return relativeUrl(
        path.join(frugal.config.publicDir, file),
    );
}
