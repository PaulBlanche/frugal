import { style } from '../../../plugins/style.ts';
import { cssModule } from '../../../plugins/cssModule.ts';
import { assertSnapshot } from '../../../dep/std/testing/snapshot.ts';
import { getBuilder, withBrowser } from '../../_utils.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';

Deno.test('script_loader: file structure', async (t) => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./page-bar.ts', './page-foo.ts'],
        log: {
            level: 'silent',
        },
        plugins: [
            cssModule(),
            style(),
        ],
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    const pageFoo1 = (await responseCache.get('/foo/1'))?.body!;
    const pageFoo2 = (await responseCache.get('/foo/2'))?.body!;
    const pageBar1 = (await responseCache.get('/bar/1'))?.body!;
    const pageBar2 = (await responseCache.get('/bar/2'))?.body!;

    await assertSnapshot(t, pageFoo1);
    await assertSnapshot(t, pageFoo2);
    await assertSnapshot(t, pageBar1);
    await assertSnapshot(t, pageBar2);

    await builder.clean();
});

Deno.test('script_loader: style order', async (t) => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./page-bar.ts', './page-foo.ts'],
        plugins: [
            cssModule(),
            style(),
        ],
    });

    const frugal = await builder.build();
    const controller = new AbortController();
    frugal.serve({ signal: controller.signal });

    await withBrowser(async (browser) => {
        const page = await browser.newPage();

        await page.goto('http://localhost:8000/foo/1');

        const fooStyles = await page.evaluate(getStyles);

        asserts.assertEquals(fooStyles, {
            page: ['rgb(128, 0, 128)', 'rgb(255, 0, 0)'],
            shared: ['rgb(0, 255, 255)'],
            global: ['rgb(255, 255, 0)'],
        });

        await page.goto('http://localhost:8000/bar/1');

        const barStyles = await page.evaluate(getStyles);

        asserts.assertEquals(barStyles, {
            page: ['rgb(128, 0, 128)', 'rgb(0, 0, 255)'],
            shared: ['rgb(0, 255, 255)'],
            global: ['rgb(255, 255, 0)'],
        });

        function getStyles() {
            const pageElement = document.getElementById('page');
            const sharedElement = document.getElementById('shared');
            const globalElement = document.getElementById('global');
            const pageStyle = getComputedStyle(pageElement!);
            const sharedStyle = getComputedStyle(sharedElement!);
            const globalStyle = getComputedStyle(globalElement!);
            return {
                page: [pageStyle.color, pageStyle.backgroundColor],
                shared: [sharedStyle.color],
                global: [globalStyle.color],
            };
        }
    }, {
        onClose: () => controller.abort(),
    });

    await builder.clean();
});
