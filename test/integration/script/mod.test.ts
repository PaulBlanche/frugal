import * as asserts from '../../../dep/std/testing/asserts.ts';
import { assertSnapshot } from '../../../dep/std/testing/snapshot.ts';
import { script } from '../../../src/build/plugins/script.ts';
import { getBuilder, withBrowser } from '../../_utils.ts';
import config from './frugal.config.ts';

Deno.test('script_loader: file structure', async (t) => {
  const builder = getBuilder({
    self: import.meta.url,
    pages: ['./page-bar.ts', './page-foo.ts'],
    log: { level: 'silent' },
    plugins: [
      script(),
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

Deno.test('script: script execution and order', async () => {
  const builder = getBuilder(config);

  await builder.build();

  // trick deno check into no analysing dynamic import, because imported file
  // does not exists yet
  const serverScript = './cli/_server.ts';
  const { serve } = await import(serverScript);

  const controller = new AbortController();
  serve({ signal: controller.signal });

  await withBrowser(async (browser) => {
    const page = await browser.newPage();

    await page.goto('http://localhost:8000/foo/1');

    const _logFoo = await page.evaluate('_log');

    asserts.assertEquals(_logFoo, ['component', 'foo', 'shared']);

    await page.goto('http://localhost:8000/bar/1');

    const _logBar = await page.evaluate('_log');

    asserts.assertEquals(_logBar, ['component', 'shared', 'bar']);
  }, {
    onClose: () => controller.abort(),
  });

  await builder.clean();
});
