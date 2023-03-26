import * as mock from '../../../dep/std/testing/mock.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';

import { DataResponse } from '../../../src/page/FrugalResponse.ts';
import { CacheEntry } from '../../../src/page/ResponseCache.ts';
import * as fixture from './__fixtures__.ts';

const persistence = new fixture.MemoryPersistence();

Deno.test('ResponseCache: cache miss renders the response and set it', async (t) => {
    const buildCache = fixture.fakeBuildCache<CacheEntry>({ config: { persistence } });
    const originalSet = buildCache.set.bind(buildCache);
    const buildCacheSetStub = mock.stub(buildCache, 'set', originalSet);

    const responseCache = fixture.fakeResponseCache({ cache: buildCache, persistence });

    const headers: HeadersInit = [['foo', 'bar']];
    const content = 'content';

    await t.step('cach miss empty', async () => {
        const response = new DataResponse({}, { headers });
        response.setRenderer(() => Promise.resolve(content));
        const originalRender = response.render.bind(response);
        const responseRenderStub = mock.stub(response, 'render', originalRender);

        const pageName = 'pageName';
        const pageHash = 'pageHash';
        await responseCache.add('foo/1', pageName, pageHash, response);

        mock.assertSpyCalls(responseRenderStub, 1);
        mock.assertSpyCalls(buildCacheSetStub, 1);
        asserts.assertEquals(buildCacheSetStub.calls[0].args[0], './foo/1/index');
        asserts.assertObjectMatch(buildCacheSetStub.calls[0].args[1], {
            name: pageName,
            pathname: 'foo/1',
            response: {
                status: 200,
                body: content,
                headers,
            },
        });

        responseRenderStub.calls.length = 0;
        buildCacheSetStub.calls.length = 0;
    });

    await t.step('cach miss hash changed', async () => {
        const response = new DataResponse({}, { headers });
        response.setRenderer(() => Promise.resolve(content));
        const originalRender = response.render.bind(response);
        const responseRenderStub = mock.stub(response, 'render', originalRender);

        const pageName = 'pageName';
        const pageHash = 'pageHash-changed';
        await responseCache.add('foo/1', pageName, pageHash, response);

        mock.assertSpyCalls(responseRenderStub, 1);
        mock.assertSpyCalls(buildCacheSetStub, 1);
        asserts.assertEquals(buildCacheSetStub.calls[0].args[0], './foo/1/index');
        asserts.assertObjectMatch(buildCacheSetStub.calls[0].args[1], {
            name: pageName,
            pathname: 'foo/1',
            response: {
                status: 200,
                body: content,
                headers,
            },
        });

        responseRenderStub.calls.length = 0;
        buildCacheSetStub.calls.length = 0;
    });

    await t.step('cach miss data changed', async () => {
        const response = new DataResponse({ foo: 'bar' }, { headers });
        response.setRenderer(() => Promise.resolve(content));
        const originalRender = response.render.bind(response);
        const responseRenderStub = mock.stub(response, 'render', originalRender);

        const pageName = 'pageName';
        const pageHash = 'pageHash';
        await responseCache.add('foo/1', pageName, pageHash, response);

        mock.assertSpyCalls(responseRenderStub, 1);
        mock.assertSpyCalls(buildCacheSetStub, 1);
        asserts.assertEquals(buildCacheSetStub.calls[0].args[0], './foo/1/index');
        asserts.assertObjectMatch(buildCacheSetStub.calls[0].args[1], {
            name: pageName,
            pathname: 'foo/1',
            response: {
                status: 200,
                body: content,
                headers,
            },
        });

        responseRenderStub.calls.length = 0;
        buildCacheSetStub.calls.length = 0;
    });
});

Deno.test('ResponseCache: cache hit do not render the response but propagate', async () => {
    const buildCache = fixture.fakeBuildCache<CacheEntry>({ config: { persistence } });
    const originalSet = buildCache.set.bind(buildCache);
    const buildCacheSetStub = mock.stub(buildCache, 'set', originalSet);
    const originalPropagate = buildCache.propagate.bind(buildCache);
    const buildCachePropagateStub = mock.stub(buildCache, 'propagate', originalPropagate);

    const responseCache = fixture.fakeResponseCache({ cache: buildCache, persistence });

    const headers: HeadersInit = [['foo', 'bar']];
    const content = 'content';

    const response = new DataResponse({}, { headers });
    response.setRenderer(() => Promise.resolve(content));

    const originalRender = response.render.bind(response);
    const responseRenderStub = mock.stub(response, 'render', originalRender);

    const pageName = 'pageName';
    const pageHash = 'pageHash';
    await responseCache.add('foo/1', pageName, pageHash, response);

    responseRenderStub.calls.length = 0;
    buildCacheSetStub.calls.length = 0;

    await responseCache.add('foo/1', pageName, pageHash, response);

    mock.assertSpyCalls(responseRenderStub, 0);
    mock.assertSpyCalls(buildCacheSetStub, 0);
    mock.assertSpyCalls(buildCachePropagateStub, 1);
});
