import { fakePageGenerator } from './__fixtures__/PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { fakeCache } from './__fixtures__/Cache.ts';
import { fakePersistance } from './__fixtures__/Persistance.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/asserts.ts';
import { assertSpyCallArgs, assertSpyCalls } from '../../../dep/std/mock.ts';

import { PageBuilder } from '../../../packages/core/PageBuilder.ts';

Deno.test('PageBuilder: build without cache hit query data, generate content and write file', async () => {
    const data = { foo: 'bar' };

    const page = fakeStaticPage<{ id: string }, { foo: string }, unknown>({
        pattern: 'foo/:id',
        getStaticData: () => data,
    });

    const cache = fakeCache({
        mock: {
            memoize: ({ producer }) => Promise.resolve(producer()),
        },
    });

    const generated = { pagePath: 'pagePath', content: 'content' };
    const generator = fakePageGenerator<
        { id: string },
        { foo: string },
        unknown
    >({
        mock: {
            generateContentFromData: () => Promise.resolve(generated),
        },
    });

    const persistance = fakePersistance();
    const builder = new PageBuilder(page, '', generator, {
        persistance,
        cache,
    });

    const path = { id: '776' };
    const phase = 'build';

    const result = await builder.build(path, phase);

    asserts.assertEquals(result, generated.pagePath);

    assertSpyCalls(asSpy(page.getStaticData), 1);
    assertSpyCallArgs(asSpy(page.getStaticData), 0, [{ phase, path }]);

    assertSpyCalls(asSpy(generator.generateContentFromData), 1);
    assertSpyCallArgs(asSpy(generator.generateContentFromData), 0, ['foo/776', {
        data,
        path,
        phase,
        method: 'GET',
    }]);

    assertSpyCalls(asSpy(persistance.set), 1);
    assertSpyCallArgs(asSpy(persistance.set), 0, [
        generated.pagePath,
        generated.content,
    ]);
});

Deno.test('PageBuilder: build with cache hit query data and return path from cache', async () => {
    const data = { foo: 'bar' };

    const page = fakeStaticPage<{ id: string }, { foo: string }, unknown>({
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

    const generator = fakePageGenerator<
        { id: string },
        { foo: string },
        unknown
    >();

    const persistance = fakePersistance();
    const builder = new PageBuilder(page, '', generator, {
        persistance,
        cache,
    });

    const path = { id: '776' };
    const phase = 'build';

    const result = await builder.build(path, phase);

    asserts.assertEquals(result, cached);

    assertSpyCalls(asSpy(page.getStaticData), 1);
    assertSpyCallArgs(asSpy(page.getStaticData), 0, [{ phase, path }]);

    assertSpyCalls(asSpy(generator.generateContentFromData), 0);

    assertSpyCalls(asSpy(persistance.set), 0);
});

Deno.test('PageBuilder: build will throw on non matching path', async () => {
    const data = { foo: 'bar' };
    const content = 'page content';

    const page = fakeStaticPage<{}, { foo: string }, unknown>({
        pattern: 'foo/:id',
        getStaticData: () => data,
        getContent: () => content,
    });

    const cache = fakeCache();

    const generator = fakePageGenerator<{}, { foo: string }, unknown>();

    const builder = new PageBuilder(page, '', generator, {
        persistance: fakePersistance(),
        cache,
    });

    const phase = 'build';

    await asserts.assertRejects(async () => {
        await builder.build({ unknownParameter: '776' }, phase);
    });
});

Deno.test('PageBuilder: buildAll orchestrate the generation of StaticPage', async () => {
    const pathList = [{ id: '1' }, { id: '3' }];
    const data = {
        [pathList[0].id]: { foo: 'bar' },
        [pathList[1].id]: { foo: 'baz' },
    };
    const generated = {
        [pathList[0].id]: { pagePath: '1', content: 'page content bar' },
        [pathList[1].id]: { pagePath: '3', content: 'page content bar' },
    };

    const page = fakeStaticPage<{ id: string }, { foo: string }, unknown>({
        pattern: 'foo/:id',
        getPathList: () => pathList,
        getStaticData: ({ path }) => data[path.id],
    });

    const cache = fakeCache({
        mock: {
            memoize: ({ producer }) => Promise.resolve(producer()),
        },
    });

    const generator = fakePageGenerator<
        { id: string },
        { foo: string },
        unknown
    >({
        mock: {
            generateContentFromData: (_0, { path }) => {
                return Promise.resolve(generated[path.id]);
            },
        },
    });

    const persistance = fakePersistance();
    const builder = new PageBuilder(page, '', generator, {
        persistance,
        cache,
    });

    await builder.buildAll();

    assertSpyCalls(asSpy(page.getPathList), 1);
    assertSpyCallArgs(asSpy(page.getPathList), 0, [{ phase: 'build' }]);

    assertSpyCalls(asSpy(page.getStaticData), 2);
    assertSpyCallArgs(asSpy(page.getStaticData), 0, [{
        phase: 'build',
        path: pathList[0],
    }]);
    assertSpyCallArgs(asSpy(page.getStaticData), 1, [{
        phase: 'build',
        path: pathList[1],
    }]);

    assertSpyCalls(asSpy(generator.generateContentFromData), 2);
    assertSpyCallArgs(asSpy(generator.generateContentFromData), 0, ['foo/1', {
        data: data[pathList[0].id],
        method: 'GET',
        path: pathList[0],
        phase: 'build',
    }]);
    assertSpyCallArgs(asSpy(generator.generateContentFromData), 1, ['foo/3', {
        data: data[pathList[1].id],
        method: 'GET',
        path: pathList[1],
        phase: 'build',
    }]);

    assertSpyCalls(asSpy(persistance.set), 2);
    assertSpyCallArgs(asSpy(persistance.set), 0, [
        generated[pathList[0].id].pagePath,
        generated[pathList[0].id].content,
    ]);
    assertSpyCallArgs(asSpy(persistance.set), 1, [
        generated[pathList[1].id].pagePath,
        generated[pathList[1].id].content,
    ]);
});

Deno.test('PageBuilder: buildAll and build throws on DynamicPage', async () => {
    const page = fakeDynamicPage();

    const cache = fakeCache();

    const generator = fakePageGenerator();

    const builder = new PageBuilder(page, '', generator, {
        persistance: fakePersistance(),
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
        persistance: fakePersistance(),
        cache,
    });

    const path = { id: '776' };
    const phase = 'build';

    await firstBuilder.build(path, phase);

    const secondPageHash = 'second-hash';
    const secondBuilder = new PageBuilder(page, secondPageHash, generator, {
        persistance: fakePersistance(),
        cache,
    });

    await secondBuilder.build(path, phase);

    const thirdBuilder = new PageBuilder(page, firstPageHash, generator, {
        persistance: fakePersistance(),
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

    const page = fakeStaticPage<{ id: string }, { foo: string }, unknown>({
        pattern: 'foo/:id',
        getStaticData: () => data.current,
    });

    const cache = fakeCache({
        mock: {
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator<
        { id: string },
        { foo: string },
        unknown
    >();

    const builder = new PageBuilder(page, '', generator, {
        persistance: fakePersistance(),
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
    const page = fakeStaticPage<{ id: string }, { foo: string }, unknown>({
        pattern: 'foo/:id',
    });

    const cache = fakeCache({
        mock: {
            memoize: () => Promise.resolve('pagePath' as any),
        },
    });

    const generator = fakePageGenerator<
        { id: string },
        { foo: string },
        unknown
    >();

    const builder = new PageBuilder(page, '', generator, {
        persistance: fakePersistance(),
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
