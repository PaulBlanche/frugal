import { PageGenerator } from '../../../packages/core/PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { fakeLoaderContext } from './__fixtures__/LoaderContext.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as path from '../../../dep/std/path.ts';
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

    const request = { id: '654' };
    const data = {};
    const pathName = 'foo/654';
    const phase = 'generate';
    const method = 'GET';

    const result = await generator.generateContentFromData(
        pathName,
        {
            method,
            data,
            request,
            phase,
        },
    );

    asserts.assertEquals(
        result.pagePath,
        path.join(publicDir, pathName, 'index.html'),
    );
    asserts.assertEquals(result.content, content);

    assertSpyCalls(asSpy(page.getContent), 1);
    assertSpyCall(asSpy(page.getContent), 0, {
        args: [{
            method,
            phase,
            data,
            loaderContext,
            pathname: 'foo/654',
            request,
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
    const searchParams = new URLSearchParams();
    const method = 'GET';

    const result = await generator.generate(pathName, {
        method,
        searchParams,
    });

    asserts.assertEquals(
        result.pagePath,
        path.join(publicDir, pathName, 'index.html'),
    );
    asserts.assertEquals(result.content, content);

    assertSpyCalls(asSpy(page.getDynamicData), 1);
    assertSpyCall(asSpy(page.getDynamicData), 0, {
        args: [{
            phase: 'generate',
            request: {
                id: '345',
            },
            searchParams,
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
            request: {
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

    const searchParams = new URLSearchParams();
    const pathName = 'bar/345';

    await asserts.assertRejects(async () => {
        await generator.generate(pathName, {
            method: 'GET',
            searchParams,
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

    const searchParams = new URLSearchParams();
    const pathName = 'foo/345';

    await asserts.assertRejects(async () => {
        await generator.generate(pathName, {
            method: 'GET',
            searchParams,
        });
    });
});
