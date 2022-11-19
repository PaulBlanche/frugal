import { PageGenerator } from '../../../packages/core/PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { fakeLoaderContext } from './__fixtures__/LoaderContext.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';
import {
    assertSpyCall,
    assertSpyCalls,
} from '../../../dep/std/testing/mock.ts';
import { assert } from 'https://deno.land/std@0.159.0/_util/assert.ts';

Deno.test('PageGenerator: generateContentFromData call page.getContent', async () => {
    const content = 'page content';
    const page = fakeDynamicPage({
        self: new URL('file:///foo/bar/page.ts'),
        pattern: 'foo/:id',
        getContent: () => content,
    });

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
            rootDir: '/foo/',
        },
    );

    const path = { id: '654' };
    const data = {};
    const pathName = 'foo/654';
    const phase = 'generate';
    const method = 'GET';

    const result = await generator.generateContentFromData(
        pathName,
        {
            method,
            data,
            path,
            phase,
        },
    );

    asserts.assertEquals(result, content);

    assertSpyCalls(asSpy(page.getContent), 1);
    assertSpyCall(asSpy(page.getContent), 0, {
        args: [{
            method,
            phase,
            data,
            loaderContext,
            pathname: 'foo/654',
            path,
            descriptor: 'bar/page.ts',
        }],
        returned: content,
    });
});

Deno.test('PageGenerator: generate orchestrate the generation of DynamicPage', async (t) => {
    // deno-lint-ignore no-explicit-any
    const store: Record<string, any> = {
        '325': {
            status: 300,
            headers: [['baz', 'foobar']],
        },
        '345': {
            data: { foo: 'bar' },
            headers: [['baz', 'foobar']],
            content: 'page content',
        },
        '867': {
            status: 502,
            location: 'foo/',
            headers: [['baz', 'foobar']],
        },
    };

    const page = fakeDynamicPage({
        self: new URL('file:///foo/bar/page.ts'),
        pattern: '/foo/:id',
        getDynamicData: (_request, { path: { id } }) => (store[id]),
        getContent: ({ path: { id } }) => store[id].content,
    });

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
            rootDir: '/foo',
        },
    );

    await t.step('standard page', async () => {
        const request = new Request(new URL('http://0.0.0.0/foo/345'), {
            method: 'GET',
        });

        const state = {};

        const result = await generator.generate(request, state);

        asserts.assert(!('status' in result));
        asserts.assertEquals(result.pagePath, 'public/dir/foo/345/index.html');
        asserts.assertEquals(result.content, store['345'].content);
        asserts.assertEquals(
            Array.from(result.headers.entries()),
            store['345'].headers,
        );

        assertSpyCalls(asSpy(page.getDynamicData), 1);
        assertSpyCall(asSpy(page.getDynamicData), 0, {
            args: [request, {
                phase: 'generate',
                path: {
                    id: '345',
                },
                state,
            }],
        });

        assertSpyCalls(asSpy(page.getContent), 1);
        assertSpyCall(asSpy(page.getContent), 0, {
            args: [{
                method: request.method,
                phase: 'generate',
                data: store['345'].data,
                loaderContext,
                pathname: new URL(request.url).pathname,
                path: {
                    id: '345',
                },
                descriptor: 'bar/page.ts',
            }],
        });

        asSpy(page.getDynamicData).calls.length = 0;
        asSpy(page.getContent).calls.length = 0;
    });

    await t.step('status page', async () => {
        const request = new Request(new URL('http://0.0.0.0/foo/325'), {
            method: 'GET',
        });

        const state = {};

        const result = await generator.generate(request, state);

        asserts.assert('status' in result);
        asserts.assertEquals(result.status, store['325'].status);
        asserts.assertEquals(
            Array.from(result.headers.entries()),
            store['325'].headers,
        );

        assertSpyCalls(asSpy(page.getDynamicData), 1);
        assertSpyCall(asSpy(page.getDynamicData), 0, {
            args: [request, {
                phase: 'generate',
                path: {
                    id: '325',
                },
                state,
            }],
        });

        assertSpyCalls(asSpy(page.getContent), 0);

        asSpy(page.getDynamicData).calls.length = 0;
        asSpy(page.getContent).calls.length = 0;
    });

    await t.step('status page with location', async () => {
        const request = new Request(new URL('http://0.0.0.0/foo/867'), {
            method: 'GET',
        });

        const state = {};

        const result = await generator.generate(request, state);

        asserts.assert('status' in result);
        asserts.assertEquals(result.status, store['867'].status);
        asserts.assertEquals(
            Array.from(result.headers.entries()),
            [...store['867'].headers, ['location', store['867'].location]],
        );

        assertSpyCalls(asSpy(page.getDynamicData), 1);
        assertSpyCall(asSpy(page.getDynamicData), 0, {
            args: [request, {
                phase: 'generate',
                path: {
                    id: '867',
                },
                state,
            }],
        });

        assertSpyCalls(asSpy(page.getContent), 0);

        asSpy(page.getDynamicData).calls.length = 0;
        asSpy(page.getContent).calls.length = 0;
    });
});

Deno.test('PageGenerator: generate throws if pathname does not match', async () => {
    const page = fakeDynamicPage({});

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
            rootDir: '/foo',
        },
    );

    const request = new Request(new URL('http://0.0.0.0/foo/345'), {
        method: 'GET',
    });

    const state = {};

    await asserts.assertRejects(async () => {
        await generator.generate(request, state);
    });
});

Deno.test('PageGenerator: generate throws for StaticPage', async () => {
    const page = fakeStaticPage({});

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
            rootDir: '/foo',
        },
    );

    const request = new Request(new URL('http://0.0.0.0/foo/345'), {
        method: 'GET',
    });

    const state = {};

    await asserts.assertRejects(async () => {
        await generator.generate(request, state);
    });
});

Deno.test('PageGenerator: generate generates StaticPage in watch mode', async () => {
    const content = 'page content';
    const data = { foo: 'bar' };
    const page = fakeStaticPage({
        self: new URL('file:///foo/bar/page.ts'),
        pattern: '/foo/:id',
        getStaticData: () => ({ data }),
        getContent: () => content,
    });

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
            watch: true,
            rootDir: '/foo',
        },
    );

    const request = new Request(new URL('http://0.0.0.0/foo/345'), {
        method: 'GET',
    });

    const state = {};

    const result = await generator.generate(request, state);

    asserts.assert(!('status' in result));
    asserts.assertEquals(result.pagePath, 'public/dir/foo/345/index.html');
    asserts.assertEquals(result.content, content);

    assertSpyCalls(asSpy(page.getStaticData), 1);
    assertSpyCall(asSpy(page.getStaticData), 0, {
        args: [{
            phase: 'generate',
            path: {
                id: '345',
            },
            state,
            // deno-lint-ignore no-explicit-any
        } as any],
        returned: { data },
    });

    assertSpyCalls(asSpy(page.getContent), 1);
    assertSpyCall(asSpy(page.getContent), 0, {
        args: [{
            method: request.method,
            phase: 'generate',
            data: data,
            loaderContext,
            pathname: new URL(request.url).pathname,
            path: {
                id: '345',
            },
            descriptor: 'bar/page.ts',
        }],
        returned: content,
    });
});

Deno.test('PageGenerator: generate generates pages with POST request', async (t) => {
    const content = 'page content';
    const data = { foo: 'bar' };

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const request = new Request(new URL('http://0.0.0.0/foo/345'), {
        method: 'POST',
    });

    const state = {};

    await t.step('DynamicPage', async () => {
        const dynamicPage = fakeDynamicPage({
            self: new URL('file:///foo/bar/page.ts'),
            pattern: '/foo/:id',
            handlers: {
                POST: () => ({ data }),
            },
            getContent: () => content,
        });

        const dynamicGenerator = new PageGenerator(
            dynamicPage,
            {
                loaderContext,
                publicDir,
                rootDir: '/foo',
            },
        );

        const dynamicResult = await dynamicGenerator.generate(request, state);

        asserts.assert(!('status' in dynamicResult));
        asserts.assertEquals(
            dynamicResult.pagePath,
            'public/dir/foo/345/index.html',
        );
        asserts.assertEquals(dynamicResult.content, content);

        assert(dynamicPage.handlers.POST);
        assertSpyCalls(asSpy(dynamicPage.handlers.POST), 1);
        assertSpyCall(asSpy(dynamicPage.handlers.POST), 0, {
            args: [request, {
                phase: 'generate',
                path: {
                    id: '345',
                },
                state,
            }],
            returned: { data },
        });

        assertSpyCalls(asSpy(dynamicPage.getContent), 1);
        assertSpyCall(asSpy(dynamicPage.getContent), 0, {
            args: [{
                method: request.method,
                phase: 'generate',
                data: data,
                loaderContext,
                pathname: new URL(request.url).pathname,
                path: {
                    id: '345',
                },
                descriptor: 'bar/page.ts',
            }],
            returned: content,
        });
    });

    await t.step('StaticPage', async () => {
        const staticPage = fakeStaticPage({
            self: new URL('file:///foo/bar/page.ts'),
            pattern: '/foo/:id',
            handlers: {
                POST: () => ({ data }),
            },
            getContent: () => content,
        });

        const staticGenerator = new PageGenerator(
            staticPage,
            {
                loaderContext,
                publicDir,
                rootDir: '/foo',
            },
        );

        const staticResult = await staticGenerator.generate(request, state);

        asserts.assert(!('status' in staticResult));
        asserts.assertEquals(
            staticResult.pagePath,
            'public/dir/foo/345/index.html',
        );
        asserts.assertEquals(staticResult.content, content);

        assert(staticPage.handlers.POST);
        assertSpyCalls(asSpy(staticPage.handlers.POST), 1);
        assertSpyCall(asSpy(staticPage.handlers.POST), 0, {
            args: [request, {
                phase: 'generate',
                path: {
                    id: '345',
                },
                state,
            }],
            returned: { data },
        });

        assertSpyCalls(asSpy(staticPage.getContent), 1);
        assertSpyCall(asSpy(staticPage.getContent), 0, {
            args: [{
                method: request.method,
                phase: 'generate',
                data: data,
                loaderContext,
                pathname: new URL(request.url).pathname,
                path: {
                    id: '345',
                },
                descriptor: 'bar/page.ts',
            }],
            returned: content,
        });
    });
});

Deno.test('PageGenerator: generate with a .html pattern', async () => {
    const content = 'page content';
    const data = { foo: 'bar' };
    const page = fakeDynamicPage({
        pattern: '/foo/:id.html',
        getDynamicData: () => ({ data }),
        getContent: () => content,
    });

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
            rootDir: '/foo',
        },
    );

    const request = new Request(new URL('http://0.0.0.0/foo/345.html'), {
        method: 'GET',
    });

    const state = {};

    const result = await generator.generate(request, state);

    asserts.assert(!('status' in result));
    asserts.assertEquals(result.pagePath, 'public/dir/foo/345.html');
});
