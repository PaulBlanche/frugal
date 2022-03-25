import { fakePageGenerator } from './__fixtures__/PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { fakeCache } from './__fixtures__/Cache.ts';
import { asSpy, FakeFileSystem } from '../test_util/mod.ts';
import * as asserts from '../../dep/std/asserts.ts';

import { PageBuilder } from './PageBuilder.ts';

Deno.test('PageBuilder: build  without cache hit query data, generate content and write file', async () => {
    new FakeFileSystem();

    const data = { foo: 'bar' };

    const page = fakeStaticPage<{ id: string }, { foo: string }>({
        pattern: 'foo/:id',
        getStaticData: () => data,
    });

    const cache = fakeCache({
        mock: {
            memoize: ({ producer }) => Promise.resolve(producer()),
        },
    });

    const generated = { pagePath: 'pagePath', content: 'content' };
    const generator = fakePageGenerator<{ id: string }, { foo: string }>({
        mock: {
            generateContentFromData: () => Promise.resolve(generated),
        },
    });

    const builder = new PageBuilder(page, '', generator, {
        cache,
    });

    const request = { id: '776' };
    const phase = 'build';

    const result = await builder.build(request, phase);

    asserts.assertEquals(result, generated.pagePath);

    asserts.assertEquals(
        asSpy(page.getStaticData).calls.map((call) => call.params),
        [
            [{ phase, request }],
        ],
    );

    asserts.assertEquals(
        asSpy(generator.generateContentFromData).calls.map((call) =>
            call.params
        ),
        [
            ['foo/776', data, request, phase],
        ],
    );

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            [generated.pagePath, generated.content],
        ],
    );
});

Deno.test('PageBuilder: build with cache hit query data and return path from cache', async () => {
    const data = { foo: 'bar' };

    const page = fakeStaticPage<{ id: string }, { foo: string }>({
        pattern: 'foo/:id',
        getStaticData: () => data,
    });

    const cached = 'pagePath';
    const cache = fakeCache({
        mock: {
            memoize: ({ otherwise }) => {
                if (otherwise) {
                    otherwise();
                }
                return Promise.resolve(cached as any);
            },
        },
    });

    const generator = fakePageGenerator<{ id: string }, { foo: string }>();

    const builder = new PageBuilder(page, '', generator, {
        cache,
    });

    const request = { id: '776' };
    const phase = 'build';

    const result = await builder.build(request, phase);

    asserts.assertEquals(result, cached);

    asserts.assertEquals(
        asSpy(page.getStaticData).calls.map((call) => call.params),
        [
            [{ phase, request }],
        ],
    );

    asserts.assertEquals(
        asSpy(generator.generateContentFromData).calls.length,
        0,
    );
});

Deno.test('PageBuilder: build will throw on non matching request', async () => {
    const data = { foo: 'bar' };
    const content = 'page content';

    const page = fakeStaticPage<object, { foo: string }>({
        pattern: 'foo/:id',
        getStaticData: () => data,
        getContent: () => content,
    });

    const cache = fakeCache();

    const generator = fakePageGenerator<object, { foo: string }>();

    const builder = new PageBuilder(page, '', generator, {
        cache,
    });

    const phase = 'build';

    await asserts.assertRejects(async () => {
        await builder.build({ unknownParameter: '776' }, phase);
    });
});

Deno.test('PageBuilder: buildAll orchestrate the generation of StaticPage', async () => {
    new FakeFileSystem();

    const requestList = [{ id: '1' }, { id: '3' }];
    const data = {
        [requestList[0].id]: { foo: 'bar' },
        [requestList[1].id]: { foo: 'baz' },
    };
    const generated = {
        [requestList[0].id]: { pagePath: '1', content: 'page content bar' },
        [requestList[1].id]: { pagePath: '3', content: 'page content bar' },
    };

    const page = fakeStaticPage<{ id: string }, { foo: string }>({
        pattern: 'foo/:id',
        getRequestList: () => requestList,
        getStaticData: ({ request }) => data[request.id],
    });

    const cache = fakeCache({
        mock: {
            memoize: ({ producer }) => Promise.resolve(producer()),
        },
    });

    const generator = fakePageGenerator<{ id: string }, { foo: string }>({
        mock: {
            generateContentFromData: (_0, _1, request, _2) => {
                return Promise.resolve(generated[request.id]);
            },
        },
    });

    const builder = new PageBuilder(page, '', generator, {
        cache,
    });

    await builder.buildAll();

    asserts.assertEquals(
        asSpy(page.getRequestList).calls.map((call) => call.params),
        [
            [{ phase: 'build' }],
        ],
    );

    asserts.assertEquals(
        asSpy(page.getStaticData).calls.map((call) => call.params),
        [
            [{ phase: 'build', request: requestList[0] }],
            [{ phase: 'build', request: requestList[1] }],
        ],
    );

    asserts.assertEquals(
        asSpy(generator.generateContentFromData).calls.map((call) =>
            call.params
        ),
        [
            [
                'foo/1',
                data[requestList[0].id],
                requestList[0],
                'build',
            ],
            [
                'foo/3',
                data[requestList[1].id],
                requestList[1],
                'build',
            ],
        ],
    );

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            [
                generated[requestList[0].id].pagePath,
                generated[requestList[0].id].content,
            ],
            [
                generated[requestList[1].id].pagePath,
                generated[requestList[1].id].content,
            ],
        ],
    );
});

Deno.test('PageBuilder: buildAll and build throws on DynamicPage', async () => {
    const page = fakeDynamicPage();

    const cache = fakeCache();

    const generator = fakePageGenerator();

    const builder = new PageBuilder(page, '', generator, {
        cache,
    });

    await asserts.assertRejects(async () => {
        await builder.buildAll();
    });

    await asserts.assertRejects(async () => {
        await builder.build({}, 'build');
    });
});

Deno.test('PageBuilder: build memoize key depends on page hash', async () => {
    const page = fakeStaticPage();

    const cache = fakeCache({
        mock: {
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator();

    const firstPageHash = 'first-hash';
    const firstBuilder = new PageBuilder(page, firstPageHash, generator, {
        cache,
    });

    const request = { id: '776' };
    const phase = 'build';

    await firstBuilder.build(request, phase);

    const secondPageHash = 'second-hash';
    const secondBuilder = new PageBuilder(page, secondPageHash, generator, {
        cache,
    });

    await secondBuilder.build(request, phase);

    const thirdBuilder = new PageBuilder(page, firstPageHash, generator, {
        cache,
    });

    await thirdBuilder.build(request, phase);

    const firstKey = asSpy(cache.memoize).calls[0].params[0].key;
    const secondKey = asSpy(cache.memoize).calls[1].params[0].key;
    const thirdKey = asSpy(cache.memoize).calls[2].params[0].key;
    asserts.assertEquals(firstKey, thirdKey);
    asserts.assertNotEquals(firstKey, secondKey);
});

Deno.test('PageBuilder: build memoize key depends on data', async () => {
    const firstData = { foo: 'bar' };
    const data = { current: firstData };

    const page = fakeStaticPage<{ id: string }, { foo: string }>({
        pattern: 'foo/:id',
        getStaticData: () => data.current,
    });

    const cache = fakeCache({
        mock: {
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator<{ id: string }, { foo: string }>();

    const builder = new PageBuilder(page, '', generator, {
        cache,
    });

    const request = { id: '776' };
    const phase = 'build';

    await builder.build(request, phase);

    const secondData = { foo: 'baz' };
    data.current = secondData;

    await builder.build(request, phase);

    data.current = firstData;

    await builder.build(request, phase);

    const firstKey = asSpy(cache.memoize).calls[0].params[0].key;
    const secondKey = asSpy(cache.memoize).calls[1].params[0].key;
    const thirdKey = asSpy(cache.memoize).calls[2].params[0].key;
    asserts.assertEquals(firstKey, thirdKey);
    asserts.assertNotEquals(firstKey, secondKey);
});

Deno.test('PageBuilder: build memoize key depends on url', async () => {
    const page = fakeStaticPage<{ id: string }, { foo: string }>({
        pattern: 'foo/:id',
    });

    const cache = fakeCache({
        mock: {
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator<{ id: string }, { foo: string }>();

    const builder = new PageBuilder(page, '', generator, {
        cache,
    });

    const firstRequest = { id: '776' };
    const phase = 'build';

    await builder.build(firstRequest, phase);

    const secondRequest = { id: '123' };
    await builder.build(secondRequest, phase);

    await builder.build(firstRequest, phase);

    const firstKey = asSpy(cache.memoize).calls[0].params[0].key;
    const secondKey = asSpy(cache.memoize).calls[1].params[0].key;
    const thirdKey = asSpy(cache.memoize).calls[2].params[0].key;
    asserts.assertEquals(firstKey, thirdKey);
    asserts.assertNotEquals(firstKey, secondKey);
});
