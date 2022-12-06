import * as frugal from '../../../../packages/core/mod.ts';
import * as path from '../../../../dep/std/path.ts';
import * as asserts from '../../../../dep/std/testing/asserts.ts';
import * as mock from '../../../../dep/std/testing/mock.ts';

import { Hash } from '../../../../packages/murmur/mod.ts';
import { page1 } from './page1.ts';
import { page2 } from './page2.ts';

Deno.test('incremental: files are not regenerated if nothing changes', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            frugal.page(page1),
            frugal.page(page2),
        ],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    const stat1page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat1page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat1page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat1page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    mock.assertSpyCalls(page1.getContent, 2);
    mock.assertSpyCalls(page2.getContent, 2);

    resetSpy();
    await (await getFrugalInstance(config)).build();

    const stat2page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat2page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat2page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat2page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    // no new getContent call because data+code did not change
    mock.assertSpyCalls(page1.getContent, 0);
    mock.assertSpyCalls(page2.getContent, 0);

    // assert files where not rewritten on second run
    asserts.assertEquals(stat1page11.mtime, stat2page11.mtime);
    asserts.assertEquals(stat1page12.mtime, stat2page12.mtime);
    asserts.assertEquals(stat1page21.mtime, stat2page21.mtime);
    asserts.assertEquals(stat1page22.mtime, stat2page22.mtime);

    resetSpy();
    await instance.clean();
});

Deno.test('incremental: files are regenerated if page code changes', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            frugal.page(page1),
            frugal.page(page2),
        ],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    const stat1page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat1page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat1page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat1page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    mock.assertSpyCalls(page1.getContent, 2);
    mock.assertSpyCalls(page2.getContent, 2);

    // add a comment at the top of page1.ts
    const originalData = await Deno.readTextFile(relativeUrl('./page1.ts'));
    await Deno.writeTextFile(
        relativeUrl('./page1.ts'),
        `//comment\n${originalData}`,
    );

    resetSpy();
    await (await getFrugalInstance(config)).build();

    const stat2page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat2page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat2page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat2page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    // page1 getContent was called again
    mock.assertSpyCalls(page1.getContent, 2);
    mock.assertSpyCalls(page2.getContent, 0);

    // files from page1 were overwritten
    asserts.assertNotEquals(stat1page11.mtime, stat2page11.mtime);
    asserts.assertNotEquals(stat1page12.mtime, stat2page12.mtime);
    asserts.assertEquals(stat1page21.mtime, stat2page21.mtime);
    asserts.assertEquals(stat1page22.mtime, stat2page22.mtime);

    resetSpy();
    await instance.clean();
    await Deno.writeTextFile(relativeUrl('./page1.ts'), originalData);
});

Deno.test('incremental: files are regenerated if dependency code changes', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            frugal.page(page1),
            frugal.page(page2),
        ],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    const stat1page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat1page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat1page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat1page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    mock.assertSpyCalls(page1.getContent, 2);
    mock.assertSpyCalls(page2.getContent, 2);

    // add a comment at the top of store.ts
    const originalData = await Deno.readTextFile(relativeUrl('./store.ts'));
    await Deno.writeTextFile(
        relativeUrl('./store.ts'),
        `//comment\n${originalData}`,
    );

    resetSpy();
    await (await getFrugalInstance(config)).build();

    const stat2page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat2page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat2page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat2page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    // page1 and page2 getContent were called again
    mock.assertSpyCalls(page1.getContent, 2);
    mock.assertSpyCalls(page2.getContent, 2);

    // files from page1 and page2 were overwritten
    asserts.assertNotEquals(stat1page11.mtime, stat2page11.mtime);
    asserts.assertNotEquals(stat1page12.mtime, stat2page12.mtime);
    asserts.assertNotEquals(stat1page21.mtime, stat2page21.mtime);
    asserts.assertNotEquals(stat1page22.mtime, stat2page22.mtime);

    resetSpy();
    await instance.clean();
    await Deno.writeTextFile(relativeUrl('./store.ts'), originalData);
});

Deno.test('incremental: files are regenerated if data changes', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            frugal.page(page1),
            frugal.page(page2),
        ],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    const stat1page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat1page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat1page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat1page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    mock.assertSpyCalls(page1.getContent, 2);
    mock.assertSpyCalls(page2.getContent, 2);

    // change data.json for page1/1
    const originalData = JSON.parse(
        await Deno.readTextFile(relativeUrl('./data.json')),
    );
    const updatedData = JSON.parse(JSON.stringify(originalData));
    updatedData[0]['1'] = {
        'data': 110,
        'headers': [['110', '110']],
        'content': '110',
    };
    await Deno.writeTextFile(
        relativeUrl('./data.json'),
        JSON.stringify(updatedData, null, 4),
    );

    resetSpy();
    await (await getFrugalInstance(config)).build();

    const stat2page11 = await Deno.stat(publicUrl(instance, 'page1/1.html'));
    const stat2page12 = await Deno.stat(publicUrl(instance, 'page1/2.html'));
    const stat2page21 = await Deno.stat(publicUrl(instance, 'page2/1.html'));
    const stat2page22 = await Deno.stat(publicUrl(instance, 'page2/2.html'));

    mock.assertSpyCalls(page1.getPathList, 1);
    mock.assertSpyCalls(page2.getPathList, 1);
    mock.assertSpyCalls(page1.GET, 2);
    mock.assertSpyCalls(page2.GET, 2);
    // page1 getContent was called again but only for the path where data changed
    mock.assertSpyCalls(page1.getContent, 1);
    mock.assertSpyCalls(page2.getContent, 0);

    // files from page1 and page2 were overwritten
    asserts.assertNotEquals(stat1page11.mtime, stat2page11.mtime);
    asserts.assertEquals(stat1page12.mtime, stat2page12.mtime);
    asserts.assertEquals(stat1page21.mtime, stat2page21.mtime);
    asserts.assertEquals(stat1page22.mtime, stat2page22.mtime);

    resetSpy();
    await instance.clean();
    await Deno.writeTextFile(
        relativeUrl('./data.json'),
        JSON.stringify(originalData, null, 4),
    );
});

async function getFrugalInstance(
    config: Pick<frugal.Config, 'pages' | 'outputDir'>,
) {
    const instance = await new frugal.FrugalBuilder({
        self: new URL(import.meta.url),
        outputDir: config.outputDir,
        pages: config.pages,
        logging: frugal.OFF_LOGGER_CONFIG,
    }).create();

    return instance;
}

function dist() {
    return `./dist-${new Hash().update(String(Math.random())).digest()}`;
}

function relativeUrl(file: string) {
    return new URL(file, import.meta.url);
}

function publicUrl(frugal: frugal.Frugal, file: string) {
    return relativeUrl(path.join(frugal.config.publicDir, file));
}

function resetSpy() {
    page1.getPathList.calls.length = 0;
    page2.getPathList.calls.length = 0;
    page1.GET.calls.length = 0;
    page2.GET.calls.length = 0;
    page1.getContent.calls.length = 0;
    page2.getContent.calls.length = 0;
}
