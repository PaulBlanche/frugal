import * as frugal from '../../../mod.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';

Deno.test('incremental', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./page1.ts', './page2.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();
    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), [
        '/page1/1',
        '/page1/2',
        '/page2/1',
        '/page2/2',
    ]);

    const updatedAt1Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt1Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt1Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt1Page22 = await responseCache.updatedAt('/page2/2');

    await builder.build();

    const updatedAt2Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt2Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt2Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt2Page22 = await responseCache.updatedAt('/page2/2');

    // assert files where not rewritten on second run
    asserts.assertEquals(updatedAt1Page11, updatedAt2Page11);
    asserts.assertEquals(updatedAt1Page12, updatedAt2Page12);
    asserts.assertEquals(updatedAt1Page21, updatedAt2Page21);
    asserts.assertEquals(updatedAt1Page22, updatedAt2Page22);

    await builder.clean();
});

Deno.test('incremental: files are regenerated if page code changes', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./page1.ts', './page2.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();
    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), [
        '/page1/1',
        '/page1/2',
        '/page2/1',
        '/page2/2',
    ]);

    const updatedAt1Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt1Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt1Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt1Page22 = await responseCache.updatedAt('/page2/2');

    // add a comment at the top of page1.ts
    const page1ModuleURL = new URL('./page1.ts', import.meta.url);
    const originalData = await Deno.readTextFile(page1ModuleURL);
    await Deno.writeTextFile(page1ModuleURL, `//comment\n${originalData}`);

    await builder.build();

    const updatedAt2Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt2Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt2Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt2Page22 = await responseCache.updatedAt('/page2/2');

    // assert files for page1 were rewritten on second run
    asserts.assertNotEquals(updatedAt1Page11, updatedAt2Page11);
    asserts.assertNotEquals(updatedAt1Page12, updatedAt2Page12);
    // assert files fro page2 were not rewritten on second run
    asserts.assertEquals(updatedAt1Page21, updatedAt2Page21);
    asserts.assertEquals(updatedAt1Page22, updatedAt2Page22);

    await builder.clean();
    await Deno.writeTextFile(page1ModuleURL, originalData);
});

Deno.test('incremental: files are regenerated if dependency code changes', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./page1.ts', './page2.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();
    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), [
        '/page1/1',
        '/page1/2',
        '/page2/1',
        '/page2/2',
    ]);

    const updatedAt1Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt1Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt1Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt1Page22 = await responseCache.updatedAt('/page2/2');

    // add a comment at the top of page1.ts
    const storeModuleURL = new URL('./store.ts', import.meta.url);
    const originalData = await Deno.readTextFile(storeModuleURL);
    await Deno.writeTextFile(storeModuleURL, `//comment\n${originalData}`);

    await builder.build();

    const updatedAt2Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt2Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt2Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt2Page22 = await responseCache.updatedAt('/page2/2');

    // assert files for page1 and page2 were rewritten on second run
    asserts.assertNotEquals(updatedAt1Page11, updatedAt2Page11);
    asserts.assertNotEquals(updatedAt1Page12, updatedAt2Page12);
    asserts.assertNotEquals(updatedAt1Page21, updatedAt2Page21);
    asserts.assertNotEquals(updatedAt1Page22, updatedAt2Page22);

    await builder.clean();
    await Deno.writeTextFile(storeModuleURL, originalData);
});

Deno.test('incremental: files are regenerated if data changes', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./page1.ts', './page2.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();
    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), [
        '/page1/1',
        '/page1/2',
        '/page2/1',
        '/page2/2',
    ]);

    const updatedAt1Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt1Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt1Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt1Page22 = await responseCache.updatedAt('/page2/2');

    // add a comment at the top of page1.ts
    const dataURL = new URL('./data.json', import.meta.url);
    const originalData = await Deno.readTextFile(dataURL);
    const updatedData = JSON.parse(originalData);
    updatedData[0]['1'] = {
        'data': 110,
    };
    await Deno.writeTextFile(dataURL, JSON.stringify(updatedData, null, 4));

    await builder.build();

    const updatedAt2Page11 = await responseCache.updatedAt('/page1/1');
    const updatedAt2Page12 = await responseCache.updatedAt('/page1/2');
    const updatedAt2Page21 = await responseCache.updatedAt('/page2/1');
    const updatedAt2Page22 = await responseCache.updatedAt('/page2/2');

    // assert only /page1/1 was rewritten
    asserts.assertNotEquals(updatedAt1Page11, updatedAt2Page11);
    asserts.assertEquals(updatedAt1Page12, updatedAt2Page12);
    asserts.assertEquals(updatedAt1Page21, updatedAt2Page21);
    asserts.assertEquals(updatedAt1Page22, updatedAt2Page22);

    await builder.clean();
    await Deno.writeTextFile(dataURL, originalData);
});

type Builder = {
    build: () => Promise<frugal.Frugal>;
    clean: () => Promise<void>;
};

function getBuilder(config: frugal.FrugalConfig): Builder {
    const outdir = `./${crypto.randomUUID()}/`;

    return {
        build: () =>
            frugal.build({
                ...config,
                outdir,
            }),
        clean: async () => {
            try {
                await Deno.remove(new URL(outdir, config.self), {
                    recursive: true,
                });
            } catch {}
        },
    };
}
