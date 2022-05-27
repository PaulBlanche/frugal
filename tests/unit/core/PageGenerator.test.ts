import { PageGenerator } from '../../../packages/core/PageGenerator.ts';
import { GenerationRequest } from '../../../packages/core/Page.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { fakeLoaderContext } from './__fixtures__/LoaderContext.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/asserts.ts';
import { assertSpyCall, assertSpyCalls } from '../../../dep/std/mock.ts';

Deno.test('PageGenerator: generateContentFromData call page.getContent', async () => {
    const content = 'page content';
    const page = fakeDynamicPage({
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

    asserts.assertEquals(result.pagePath, 'public/dir/foo/654/index.html');
    asserts.assertEquals(result.content, content);

    assertSpyCalls(asSpy(page.getContent), 1);
    assertSpyCall(asSpy(page.getContent), 0, {
        args: [{
            method,
            phase,
            data,
            loaderContext,
            pathname: 'foo/654',
            path,
        }],
        returned: content,
    });
});

Deno.test('PageGenerator: generate orchestrate the generation of DynamicPage', async () => {
    const content = 'page content';
    const data = { foo: 'bar' };
    const page = fakeDynamicPage({
        pattern: '/foo/:id',
        getDynamicData: () => data,
        getContent: () => content,
    });

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
        },
    );

    const request: GenerationRequest<unknown> = {
        url: new URL('http://0.0.0.0/foo/345'),
        method: 'GET',
        headers: new Headers(),
        body: undefined,
    };

    const result = await generator.generate(request);

    asserts.assertEquals(result.pagePath, 'public/dir/foo/345/index.html');
    asserts.assertEquals(result.content, content);

    assertSpyCalls(asSpy(page.getDynamicData), 1);
    assertSpyCall(asSpy(page.getDynamicData), 0, {
        args: [{
            phase: 'generate',
            path: {
                id: '345',
            },
            request,
        }],
        returned: data,
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
        }],
        returned: content,
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
        },
    );

    const request: GenerationRequest<unknown> = {
        url: new URL('http://0.0.0.0/foo/345'),
        method: 'GET',
        headers: new Headers(),
        body: undefined,
    };

    await asserts.assertRejects(async () => {
        await generator.generate(request);
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
        },
    );

    const request: GenerationRequest<unknown> = {
        url: new URL('http://0.0.0.0/foo/345'),
        method: 'GET',
        headers: new Headers(),
        body: undefined,
    };

    await asserts.assertRejects(async () => {
        await generator.generate(request);
    });
});

Deno.test('PageGenerator: generate generates StaticPage in watch mode', async () => {
    const content = 'page content';
    const data = { foo: 'bar' };
    const page = fakeStaticPage({
        pattern: '/foo/:id',
        getStaticData: () => data,
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
        },
    );

    const request: GenerationRequest<unknown> = {
        url: new URL('http://0.0.0.0/foo/345'),
        method: 'GET',
        headers: new Headers(),
        body: undefined,
    };

    const result = await generator.generate(request);

    asserts.assertEquals(result.pagePath, 'public/dir/foo/345/index.html');
    asserts.assertEquals(result.content, content);

    assertSpyCalls(asSpy(page.getStaticData), 1);
    assertSpyCall(asSpy(page.getStaticData), 0, {
        args: [{
            phase: 'generate',
            path: {
                id: '345',
            },
        }],
        returned: data,
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
        }],
        returned: content,
    });
});

Deno.test('PageGenerator: generate generates pages with POST request', async (t) => {
    const content = 'page content';
    const data = { foo: 'bar' };

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const request: GenerationRequest<unknown> = {
        url: new URL('http://0.0.0.0/foo/345'),
        method: 'POST',
        headers: new Headers(),
        body: undefined,
    };

    await t.step('DynamicPage', async () => {
        const dynamicPage = fakeDynamicPage({
            pattern: '/foo/:id',
            postDynamicData: () => data,
            getContent: () => content,
        });

        const dynamicGenerator = new PageGenerator(
            dynamicPage,
            {
                loaderContext,
                publicDir,
            },
        );

        const dynamicResult = await dynamicGenerator.generate(request);

        asserts.assertEquals(
            dynamicResult.pagePath,
            'public/dir/foo/345/index.html',
        );
        asserts.assertEquals(dynamicResult.content, content);

        assertSpyCalls(asSpy(dynamicPage.postDynamicData), 1);
        assertSpyCall(asSpy(dynamicPage.postDynamicData), 0, {
            args: [{
                phase: 'generate',
                path: {
                    id: '345',
                },
                request,
            }],
            returned: data,
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
            }],
            returned: content,
        });
    });

    await t.step('StaticPage', async () => {
        const staticPage = fakeStaticPage({
            pattern: '/foo/:id',
            postDynamicData: () => data,
            getContent: () => content,
        });

        const staticGenerator = new PageGenerator(
            staticPage,
            {
                loaderContext,
                publicDir,
            },
        );

        const staticResult = await staticGenerator.generate(request);

        asserts.assertEquals(
            staticResult.pagePath,
            'public/dir/foo/345/index.html',
        );
        asserts.assertEquals(staticResult.content, content);

        assertSpyCalls(asSpy(staticPage.postDynamicData), 1);
        assertSpyCall(asSpy(staticPage.postDynamicData), 0, {
            args: [{
                phase: 'generate',
                path: {
                    id: '345',
                },
                request,
            }],
            returned: data,
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
        getDynamicData: () => data,
        getContent: () => content,
    });

    const loaderContext = fakeLoaderContext();
    const publicDir = 'public/dir';

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir,
        },
    );

    const request: GenerationRequest<unknown> = {
        url: new URL('http://0.0.0.0/foo/345.html'),
        method: 'GET',
        headers: new Headers(),
        body: undefined,
    };

    const result = await generator.generate(request);

    asserts.assertEquals(result.pagePath, 'public/dir/foo/345.html');
});
