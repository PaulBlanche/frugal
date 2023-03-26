import * as asserts from '../../../dep/std/testing/asserts.ts';

import * as frugal from '../../../mod.ts';

Deno.test('pages: build with no page ', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: [],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), []);

    await builder.clean();
});

Deno.test('pages: build with page that do not exists', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./page-that-does-not-exists.ts'],
        log: { level: 'silent' },
    });

    await asserts.assertRejects(
        () => builder.build(),
        'file "./page-that-does-not-exists.ts" is not accessible',
    );
    await builder.clean();
});

Deno.test('pages: build with trivial static page', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./trivialPage.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), ['/']);

    const response = await responseCache.get('/');
    asserts.assertEquals(response?.serialize(), {
        status: 200,
        headers: [],
        body: 'Hello world',
    });

    await builder.clean();
});

Deno.test('pages: build with trivial static page with getData', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./trivialPageWithGetData.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), ['/']);

    const response = await responseCache.get('/');
    asserts.assertEquals(response?.serialize(), {
        status: 204,
        headers: [['my-header', 'quux']],
        body: 'bar',
    });

    await builder.clean();
});

Deno.test('pages: build with trivial static page with getPathList', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./trivialPageWithGetPathList.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), [
        '/foo/bar',
        '/fooz/baz',
    ]);

    const response1 = await responseCache.get('/foo/bar');
    asserts.assertEquals(response1?.serialize(), {
        status: 200,
        headers: [],
        body: 'Hello world',
    });

    const response2 = await responseCache.get('/foo/bar');
    asserts.assertEquals(response2?.serialize(), {
        status: 200,
        headers: [],
        body: 'Hello world',
    });

    await builder.clean();
});

Deno.test('pages: build complete static page', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./completePage.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), [
        '/bar',
        '/foo',
    ]);

    const response1 = await responseCache.get('/foo');
    asserts.assertEquals(response1?.serialize(), {
        status: 201,
        headers: [['x-foo', 'foo']],
        body: 'data: Hello foo',
    });

    const response2 = await responseCache.get('/bar');
    asserts.assertEquals(response2?.serialize(), {
        status: 202,
        headers: [['x-foo', 'bar']],
        body: 'data: Hello bar',
    });

    await builder.clean();
});

Deno.test('pages: build dynamic page', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./dynamicPage.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), []);

    await builder.clean();
});

Deno.test('pages: build pages with non ok responses', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./pageWithNonOkResponse.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), ['/']);

    const response = await responseCache.get('/');
    asserts.assertEquals(response?.serialize(), {
        status: 405,
        headers: [['my-header', 'quux']],
        body: undefined,
    });

    await builder.clean();
});

Deno.test('pages: build pages with empty responses', async () => {
    const builder = getBuilder({
        self: import.meta.url,
        pages: ['./pageWithEmptyResponse.ts'],
        log: { level: 'silent' },
    });

    const frugal = await builder.build();

    const responseCache = await frugal.config.responseCache('runtime');
    asserts.assertEquals(await responseCache.pathnames(), ['/']);

    const response = await responseCache.get('/');
    asserts.assertEquals(response?.serialize(), {
        status: 200,
        headers: [['my-header', 'quux']],
        body: undefined,
    });

    await builder.clean();
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
