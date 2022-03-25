import {
    build,
    Config,
    OFF_LOGGER_CONFIG,
    page,
} from '../../packages/core/mod.ts';
import * as asserts from '../../dep/std/asserts.ts';
import { Hash } from '../../packages/murmur/mod.ts';
import { snapshot } from '../../packages/test_util/snapshot.ts';

import * as myPage from './myPage.ts';

const { assertSnapshot } = snapshot(import.meta.url);

Deno.test('Integration:Basic: file structure', async () => {
    const config: Config = {
        self: new URL(import.meta.url),
        outputDir: dist(),
        pages: [
            page(myPage),
        ],
        logging: OFF_LOGGER_CONFIG,
    };

    const frugal = await build(config);

    const page1 = await Deno.readTextFile(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );

    const page2 = await Deno.readTextFile(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    // assert file content
    assertSnapshot('page1:file structure', page1);
    assertSnapshot('page2:file structure', page2);

    await frugal.clean();
});

Deno.test('Integration:Basic: files are not regenerated if nothing changes', async () => {
    const config = {
        self: new URL(import.meta.url),
        outputDir: dist(),
        pages: [
            page(myPage),
        ],
        logging: OFF_LOGGER_CONFIG,
    };

    let frugal = await build(config);

    const stat11 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat12 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    frugal = await build(config);

    const stat21 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat22 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    // assert filew where not rewritten on second run
    asserts.assertEquals(stat11.mtime, stat21.mtime);
    asserts.assertEquals(stat12.mtime, stat22.mtime);

    await frugal.clean();
});

Deno.test('Integration:Basic: files are regenerated if page code change', async () => {
    const config = {
        self: new URL(import.meta.url),
        outputDir: dist(),
        pages: [
            page(myPage),
        ],
        logging: OFF_LOGGER_CONFIG,
    };

    let frugal = await build(config);

    const stat11 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat12 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    const originalData = await Deno.readTextFile(
        new URL('./myPage.ts', import.meta.url),
    );
    await Deno.writeTextFile(
        new URL('./myPage.ts', import.meta.url),
        `//comment\n${originalData}`,
    );

    frugal = await build(config);

    const stat21 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat22 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    // assert filew where overwritten on second run
    asserts.assertNotEquals(stat11.mtime, stat21.mtime);
    asserts.assertNotEquals(stat12.mtime, stat22.mtime);

    await Deno.writeTextFile(
        new URL('./myPage.ts', import.meta.url),
        originalData,
    );

    await frugal.clean();
});

Deno.test('Integration:Basic: files are regenerated if code of dependency change', async () => {
    const config = {
        self: new URL(import.meta.url),
        outputDir: dist(),
        pages: [
            page(myPage),
        ],
        logging: OFF_LOGGER_CONFIG,
    };

    let frugal = await build(config);

    const stat11 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat12 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    const originalData = await Deno.readTextFile(
        new URL('./article.ts', import.meta.url),
    );
    await Deno.writeTextFile(
        new URL('./article.ts', import.meta.url),
        `//comment\n${originalData}`,
    );

    frugal = await build(config);

    const stat21 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat22 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    // assert filew where overwritten on second run
    asserts.assertNotEquals(stat11.mtime, stat21.mtime);
    asserts.assertNotEquals(stat12.mtime, stat22.mtime);

    await Deno.writeTextFile(
        new URL('./article.ts', import.meta.url),
        originalData,
    );

    await frugal.clean();
});

Deno.test('Integration:Basic: files are regenerated if data change', async () => {
    const config = {
        self: new URL(import.meta.url),
        outputDir: dist(),
        pages: [
            page(myPage),
        ],
        logging: OFF_LOGGER_CONFIG,
    };

    let frugal = await build(config);

    const stat11 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat12 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    const originalData = await Deno.readTextFile(
        new URL('./data.json', import.meta.url),
    );
    await Deno.writeTextFile(
        new URL('./data.json', import.meta.url),
        JSON.stringify({
            ...JSON.parse(originalData),
            '1': {
                'title': 'first article !',
                'content': 'this is the first article (edited)',
            },
        }),
    );

    frugal = await build(config);

    const stat21 = await Deno.stat(
        new URL(`${config.outputDir}/public/1.html`, import.meta.url),
    );
    const stat22 = await Deno.stat(
        new URL(`${config.outputDir}/public/2.html`, import.meta.url),
    );

    // assert files where overwritten on second run
    asserts.assertNotEquals(stat11.mtime, stat21.mtime);
    asserts.assertEquals(stat12.mtime, stat22.mtime);

    await Deno.writeTextFile(
        new URL('./data.json', import.meta.url),
        originalData,
    );

    await frugal.clean();
});

function dist() {
    return `./dist-${new Hash().update(String(Math.random())).alphabetic()}`;
}
