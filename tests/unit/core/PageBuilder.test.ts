import { fakePageGenerator } from './__fixtures__/PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { fakeCache } from './__fixtures__/Cache.ts';
import { fakePersistence } from './__fixtures__/Persistence.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';
import {
    assertSpyCallArgs,
    assertSpyCalls,
} from '../../../dep/std/testing/mock.ts';

import { PageBuilder } from '../../../packages/core/PageBuilder.ts';

Deno.test('PageBuilder: build without cache hit query data, generate content and write file', async () => {
    const data = { foo: 'bar' };

    const page = fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
        GET: () => ({ data }),
    });

    const cache = fakeCache({
        mock: {
            memoize: ({ producer }) => Promise.resolve(producer()),
        },
    });

    const generated = { pagePath: 'pagePath', content: 'content' };
    const generator = fakePageGenerator<{ foo: string }, 'foo/:id'>({
        mock: {
            generateContentFromData: () => Promise.resolve(generated.content),
            getPagePath: () => generated.pagePath,
        },
    });

    const persistence = fakePersistence();
    const builder = new PageBuilder(page, '', generator, {
        persistence,
        cache,
    });

    const buildPath = { id: '776' };
    const phase = 'build';

    const result = await builder.build(buildPath, phase);

    asserts.assertEquals(result, generated.pagePath);

    assertSpyCalls(asSpy(page.GET), 1);
    assertSpyCallArgs(asSpy(page.GET), 0, [{
        phase,
        path: buildPath,
    }]);

    assertSpyCalls(asSpy(generator.generateContentFromData), 1);
    assertSpyCallArgs(asSpy(generator.generateContentFromData), 0, ['foo/776', {
        data,
        path: buildPath,
        phase,
        method: 'GET',
    }]);

    assertSpyCalls(asSpy(persistence.set), 1);
    assertSpyCallArgs(asSpy(persistence.set), 0, [
        generated.pagePath,
        generated.content,
    ]);
});

Deno.test('PageBuilder: build with cache hit query data and return path from cache', async () => {
    const data = { foo: 'bar' };

    const page = fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
        GET: () => ({ data }),
    });

    const cached = 'pagePath';
    const cache = fakeCache({
        mock: {
            memoize: ({ otherwise }) => {
                if (otherwise) {
                    otherwise();
                }
                // deno-lint-ignore no-explicit-any
                return Promise.resolve(cached as any);
            },
        },
    });

    const generator = fakePageGenerator<{ foo: string }, 'foo/:id'>();

    const persistence = fakePersistence();
    const builder = new PageBuilder(page, '', generator, {
        persistence,
        cache,
    });

    const path = { id: '776' };
    const phase = 'build';

    const result = await builder.build(path, phase);

    asserts.assertEquals(result, cached);

    assertSpyCalls(asSpy(page.GET), 1);
    assertSpyCallArgs(asSpy(page.GET), 0, [{ phase, path }]);

    assertSpyCalls(asSpy(generator.generateContentFromData), 0);

    assertSpyCalls(asSpy(persistence.set), 0);
});

Deno.test('PageBuilder: build will throw on non matching path', async () => {
    const data = { foo: 'bar' };
    const content = 'page content';

    // deno-lint-ignore no-explicit-any
    const page = fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
        GET: () => ({ data }),
        getContent: () => content,
    });

    const cache = fakeCache();

    // deno-lint-ignore no-explicit-any
    const generator = fakePageGenerator<{ foo: string }, 'foo/:id'>();

    const builder = new PageBuilder(page, '', generator, {
        persistence: fakePersistence(),
        cache,
    });

    const phase = 'build';

    await asserts.assertRejects(async () => {
        //@ts-expect-error: volontary type error to test runtime behaviour
        await builder.build({ unknownParameter: '776' }, phase);
    });
});

Deno.test('PageBuilder: buildAll orchestrate the generation of StaticPage', async () => {
    // deno-lint-ignore no-explicit-any
    const store: Record<string, any> = {
        '1': {
            path: { id: '1' },
            data: { foo: 'bar' },
            pagePath: 'foo/1/index.html',
            content: 'page content bar',
        },
        '2': {
            path: { id: '2' },
            data: { foo: 'bar' },
            headers: [['baz', 'foobar']],
            status: 300,
            location: 'foo/',
            pagePath: 'foo/2/index.html',
        },
        '3': {
            path: { id: '3' },
            data: { foo: 'baz' },
            headers: [['quux', 'foobaz']],
            pagePath: 'foo/3/index.html',
            content: 'page content baz',
        },
    };

    const page = fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
        getPathList: () => Object.values(store).map((entry) => entry.path),
        GET: ({ path }) => store[path.id],
    });

    const cache = fakeCache({
        mock: {
            memoize: ({ producer }) => Promise.resolve(producer()),
        },
    });

    const generator = fakePageGenerator<{ foo: string }, 'foo/:id'>({
        mock: {
            generateContentFromData: (_0, { path }) => {
                return Promise.resolve(store[path.id].content);
            },
        },
    });

    const persistence = fakePersistence();
    const builder = new PageBuilder(page, '', generator, {
        persistence,
        cache,
    });

    await builder.buildAll();

    assertSpyCalls(asSpy(page.getPathList), 1);
    assertSpyCallArgs(asSpy(page.getPathList), 0, [{ phase: 'build' }]);

    assertSpyCalls(asSpy(page.GET), 3);
    assertSpyCallArgs(asSpy(page.GET), 0, [{
        phase: 'build',
        path: store['1'].path,
    }]);
    assertSpyCallArgs(asSpy(page.GET), 1, [{
        phase: 'build',
        path: store['2'].path,
    }]);
    assertSpyCallArgs(asSpy(page.GET), 2, [{
        phase: 'build',
        path: store['3'].path,
    }]);

    assertSpyCalls(asSpy(generator.generateContentFromData), 2);
    assertSpyCallArgs(asSpy(generator.generateContentFromData), 0, ['foo/1', {
        data: store['1'].data,
        method: 'GET',
        path: store['1'].path,
        phase: 'build',
    }]);
    assertSpyCallArgs(asSpy(generator.generateContentFromData), 1, ['foo/3', {
        data: store['3'].data,
        method: 'GET',
        path: store['3'].path,
        phase: 'build',
    }]);

    // one call for page1 content
    // one call for page2 metadata
    // two call for page3 content and metadata
    assertSpyCalls(asSpy(persistence.set), 4);
    assertSpyCallArgs(asSpy(persistence.set), 0, [
        `${store['2'].pagePath}.metadata`,
        JSON.stringify({
            headers: [...store['2'].headers, ['location', store['2'].location]],
            status: store['2'].status,
        }),
    ]);
    assertSpyCallArgs(asSpy(persistence.set), 1, [
        store['1'].pagePath,
        store['1'].content,
    ]);
    assertSpyCallArgs(asSpy(persistence.set), 2, [
        store['3'].pagePath,
        store['3'].content,
    ]);
    assertSpyCallArgs(asSpy(persistence.set), 3, [
        `${store['3'].pagePath}.metadata`,
        JSON.stringify({
            headers: store['3'].headers,
            status: store['3'].status,
        }),
    ]);
});

Deno.test('PageBuilder: buildAll and build throws on DynamicPage', async () => {
    const page = fakeDynamicPage();

    const cache = fakeCache();

    const generator = fakePageGenerator();

    const builder = new PageBuilder(page, '', generator, {
        persistence: fakePersistence(),
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
            // deno-lint-ignore no-explicit-any
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator();

    const firstPageHash = 'first-hash';
    const firstBuilder = new PageBuilder(page, firstPageHash, generator, {
        persistence: fakePersistence(),
        cache,
    });

    const path = { id: '776' };
    const phase = 'build';

    await firstBuilder.build(path, phase);

    const secondPageHash = 'second-hash';
    const secondBuilder = new PageBuilder(page, secondPageHash, generator, {
        persistence: fakePersistence(),
        cache,
    });

    await secondBuilder.build(path, phase);

    const thirdBuilder = new PageBuilder(page, firstPageHash, generator, {
        persistence: fakePersistence(),
        cache,
    });

    await thirdBuilder.build(path, phase);

    const firstKey = asSpy(cache.memoize).calls[0].args[0].key;
    const secondKey = asSpy(cache.memoize).calls[1].args[0].key;
    const thirdKey = asSpy(cache.memoize).calls[2].args[0].key;
    asserts.assertEquals(firstKey, thirdKey);
    asserts.assertNotEquals(firstKey, secondKey);
});

Deno.test('PageBuilder: build memoize key depends on data', async () => {
    const firstData = { foo: 'bar' };
    const data = { current: firstData };

    const page = fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
        GET: () => ({ data: data.current }),
    });

    const cache = fakeCache({
        mock: {
            // deno-lint-ignore no-explicit-any
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator<{ foo: string }, 'foo/:id'>();

    const builder = new PageBuilder(page, '', generator, {
        persistence: fakePersistence(),
        cache,
    });

    const path = { id: '776' };
    const phase = 'build';

    await builder.build(path, phase);

    const secondData = { foo: 'baz' };
    data.current = secondData;

    await builder.build(path, phase);

    data.current = firstData;

    await builder.build(path, phase);

    const firstKey = asSpy(cache.memoize).calls[0].args[0].key;
    const secondKey = asSpy(cache.memoize).calls[1].args[0].key;
    const thirdKey = asSpy(cache.memoize).calls[2].args[0].key;
    asserts.assertEquals(firstKey, thirdKey);
    asserts.assertNotEquals(firstKey, secondKey);
});

Deno.test('PageBuilder: build memoize key depends on url', async () => {
    const page = fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
    });

    const cache = fakeCache({
        mock: {
            // deno-lint-ignore no-explicit-any
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator<{ foo: string }, 'foo/:id'>();

    const builder = new PageBuilder(page, '', generator, {
        persistence: fakePersistence(),
        cache,
    });

    const firstPath = { id: '776' };
    const phase = 'build';

    await builder.build(firstPath, phase);

    const secondPath = { id: '123' };
    await builder.build(secondPath, phase);

    await builder.build(firstPath, phase);

    const firstKey = asSpy(cache.memoize).calls[0].args[0].key;
    const secondKey = asSpy(cache.memoize).calls[1].args[0].key;
    const thirdKey = asSpy(cache.memoize).calls[2].args[0].key;
    asserts.assertEquals(firstKey, thirdKey);
    asserts.assertNotEquals(firstKey, secondKey);
});
