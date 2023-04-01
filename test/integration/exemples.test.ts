import * as path from '../../dep/std/path.ts';
import * as streams from '../../dep/std/streams.ts';
import * as asserts from '../../dep/std/testing/asserts.ts';
import { withBrowser } from '../_utils.ts';

Deno.test('exemple:svelte', async (t) => {
  const root = path.resolve(Deno.cwd(), 'exemples/svelte/');
  await counterExempleTestSuit(root, t);
});

Deno.test('exemple:preact', async (t) => {
  const root = path.resolve(Deno.cwd(), 'exemples/preact/');
  await counterExempleTestSuit(root, t);
});

async function counterExempleTestSuit(root: string, t: Deno.TestContext) {
  const buildCommand = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', '--unstable', 'cli/build.ts'],
    cwd: root,
    stdout: 'null',
  });
  const buildProcess = buildCommand.spawn();
  await buildProcess.status;

  const serveCommand = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', '--unstable', 'cli/serve.ts'],
    cwd: root,
    stdout: 'piped',
  });
  const serveProcess = serveCommand.spawn();

  await awaitServerUp(serveProcess);

  await t.step('Counter js', async (t) => {
    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8000/');

      const counters = await page.$$('.counter');

      await t.step('not in island', async () => {
        const counter = counters[0];

        const [decrementButton, incrementButton] = await counter.$$(
          'button',
        );
        const display = await counter.$('pre');

        asserts.assert(display !== null);

        await decrementButton.evaluate((element) => element.click());
        asserts.assertEquals(
          await display.evaluate((display) => display.textContent),
          '0',
        );

        await incrementButton.evaluate((element) => element.click());
        asserts.assertEquals(
          await display.evaluate((display) => display.textContent),
          '0',
        );
      });

      await t.step('onload island', async () => {
        const counter = counters[1];

        await page.waitForSelector('main>[data-hydrated]');

        const [decrementButton, incrementButton] = await counter.$$(
          'button',
        );
        const display = await counter.$('pre');

        asserts.assert(display !== null);

        await decrementButton.evaluate((element) => element.click());
        asserts.assertEquals(
          await display.evaluate((display) => display.textContent),
          '-1',
        );

        await incrementButton.evaluate((element) => element.click());
        asserts.assertEquals(
          await display.evaluate((display) => display.textContent),
          '0',
        );
      });

      await t.step('onvisible island ', async (t) => {
        const counter = counters[2];

        const [decrementButton, incrementButton] = await counter.$$(
          'button',
        );
        const display = await counter.$('pre');

        asserts.assert(display !== null);

        await t.step('no visible', async () => {
          await decrementButton.evaluate((element) => element.click());
          asserts.assertEquals(
            await display.evaluate((display) => display.textContent),
            '0',
          );

          await incrementButton.evaluate((element) => element.click());
          asserts.assertEquals(
            await display.evaluate((display) => display.textContent),
            '0',
          );
        });

        await t.step('visible', async () => {
          counter.evaluate((element) => element.scrollIntoView());
          await page.waitForSelector('main>.scroll-padder+[data-hydrated]');

          await decrementButton.evaluate((element) => element.click());
          asserts.assertEquals(
            await display.evaluate((display) => display.textContent),
            '-1',
          );

          await incrementButton.evaluate((element) => element.click());
          asserts.assertEquals(
            await display.evaluate((display) => display.textContent),
            '0',
          );
        });
      });
    });
  });

  await t.step('Counter style', async (t) => {
    await withBrowser(async (browser) => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8000/');
      await new Promise((res) => setTimeout(res, 0));

      await t.step('global styles', async () => {
        const main = await page.$('main');
        asserts.assert(main !== null);

        const maxWidth = await main.evaluate((main) => {
          return getComputedStyle(main).getPropertyValue('max-width');
        });
        asserts.assertEquals(maxWidth, '600px');
      });

      await t.step('scoped style', async () => {
        const counter = await page.$('.counter');

        asserts.assert(counter !== null);

        const counterStyle = await counter.evaluate((counter) => {
          return getComputedStyle(counter).getPropertyValue('display');
        });
        asserts.assertEquals(counterStyle, 'grid');
      });
    });
  });

  serveProcess.kill();
  await serveProcess.status;
}

function awaitServerUp(serveProcess: Deno.ChildProcess) {
  const lines = serveProcess.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new streams.TextLineStream());

  return new Promise<void>((res, rej) => {
    (async () => {
      for await (const line of lines) {
        if (line.includes('listening on http://0.0.0.0:8000')) {
          setTimeout(() => res(), 0);
        }
      }
    })().catch(rej);
  });
}
