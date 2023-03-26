import * as mock from '../../../dep/std/testing/mock.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';

import * as fixture from './__fixtures__.ts';
import { PageBuilder } from '../../../src/page/PageBuilder.ts';
import { DataResponse } from '../../../src/page/FrugalResponse.ts';

Deno.test('PageBuilder: build should fetch data and add the response to the cache', async () => {
    const dataResponse = new DataResponse({ foo: 'bar' });

    const page = fixture.fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
    });
    const pageGETStub = mock.stub(page, 'GET', () => dataResponse);

    const cache = fixture.fakeResponseCache();
    const cacheAddStub = mock.stub(cache, 'add', () => Promise.resolve());

    const generator = fixture.fakePageGenerator<{ foo: string }, 'foo/:id'>();

    const name = 'foo.ts';
    const hash = 'pageHash';
    const builder = new PageBuilder({
        page,
        name,
        hash,
        generator,
        cache,
    });

    const buildPath = { id: '776' };
    const phase = 'build';

    await builder.build(buildPath, phase);

    mock.assertSpyCalls(pageGETStub, 1);

    mock.assertSpyCalls(cacheAddStub, 1);
    mock.assertSpyCall(cacheAddStub, 0, {
        args: ['foo/776', name, hash, dataResponse as any],
        returned: Promise.resolve(undefined),
    });
});

Deno.test('PageBuilder: build will throw on non matching path', async () => {
    const page = fixture.fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
    });

    const cache = fixture.fakeResponseCache();

    const generator = fixture.fakePageGenerator<{ foo: string }, 'foo/:id'>();

    const name = 'foo.ts';
    const hash = 'pageHash';
    const builder = new PageBuilder({
        page,
        name,
        hash,
        generator,
        cache,
    });

    const phase = 'build';

    await asserts.assertRejects(async () => {
        // deno-lint-ignore no-explicit-any
        await builder.build({ unknownParameter: '776' } as any, phase);
    });
});

Deno.test('PageBuilder: buildAll orchestrate the generation of StaticPage', async () => {
    // deno-lint-ignore no-explicit-any
    const store: Record<string, any> = {
        '1': {
            path: { id: '1' },
            response: new DataResponse({ foo: 'bar' }),
        },
        '2': {
            path: { id: '2' },
            response: new DataResponse({ foo: 'bar' }, {
                headers: [['baz', 'foobar']],
                status: 300,
            }),
        },
        '3': {
            path: { id: '3' },
            response: new DataResponse({ foo: 'baz' }, {
                headers: [['quux', 'foobaz']],
            }),
        },
    };

    const page = fixture.fakeStaticPage<{ foo: string }, 'foo/:id'>({
        pattern: 'foo/:id',
    });
    const pageGetPathListStub = mock.stub(
        page,
        'getPathList',
        () => Object.values(store).map((entry) => entry.path),
    );
    const pageGETStub = mock.stub(page, 'GET', ({ path }) => {
        return store[path.id].response;
    });

    const cache = fixture.fakeResponseCache();
    const cacheAddStub = mock.stub(cache, 'add', () => Promise.resolve());

    const generator = fixture.fakePageGenerator<{ foo: string }, 'foo/:id'>();

    const name = 'foo.ts';
    const hash = 'pageHash';
    const builder = new PageBuilder({
        page,
        name,
        hash,
        generator,
        cache,
    });

    await builder.buildAll();

    mock.assertSpyCalls(pageGetPathListStub, 1);
    mock.assertSpyCallArgs(pageGetPathListStub, 0, [{ phase: 'build' }]);

    mock.assertSpyCalls(pageGETStub, 3);
    mock.assertSpyCallArgs(pageGETStub, 0, [{
        phase: 'build',
        path: store['1'].path,
    }]);
    mock.assertSpyCallArgs(pageGETStub, 1, [{
        phase: 'build',
        path: store['2'].path,
    }]);
    mock.assertSpyCallArgs(pageGETStub, 2, [{
        phase: 'build',
        path: store['3'].path,
    }]);

    mock.assertSpyCalls(cacheAddStub, 3);
    mock.assertSpyCall(cacheAddStub, 0, {
        args: ['foo/1', name, hash, store['1'].response],
    });
    mock.assertSpyCall(cacheAddStub, 1, {
        args: ['foo/2', name, hash, store['2'].response],
    });
    mock.assertSpyCall(cacheAddStub, 2, {
        args: ['foo/3', name, hash, store['3'].response],
    });
});

Deno.test('PageBuilder: buildAll and build throws on DynamicPage', async () => {
    const page = fixture.fakeDynamicPage();

    const cache = fixture.fakeResponseCache();

    const generator = fixture.fakePageGenerator();

    const name = 'foo.ts';
    const hash = 'pageHash';
    const builder = new PageBuilder({
        page,
        name,
        hash,
        generator,
        cache,
    });

    await asserts.assertRejects(async () => {
        await builder.buildAll();
    });

    await asserts.assertRejects(async () => {
        await builder.build({}, 'build');
    });
});
