import { PageGenerator } from '../../../packages/core/PageGenerator.ts';
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
        pattern: 'foo/:id',
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

    const pathName = 'foo/345';
    const method = 'GET';
    const request = new Request('http://0.0.0.0/foo/345', { method });

    const result = await generator.generate(pathName, {
        request,
    });

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
            method,
            phase: 'generate',
            data: data,
            loaderContext,
            pathname: 'foo/345',
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

    const pathName = 'bar/345';
    const request = new Request('http://0.0.0.0/foo/345', { method: 'GET' });

    await asserts.assertRejects(async () => {
        await generator.generate(pathName, {
            request,
        });
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

    const pathName = 'foo/345';
    const request = new Request('http://0.0.0.0/foo/345', { method: 'GET' });

    await asserts.assertRejects(async () => {
        await generator.generate(pathName, {
            request,
        });
    });
});
