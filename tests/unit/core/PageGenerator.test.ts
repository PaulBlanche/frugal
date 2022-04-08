import { PageGenerator } from '../../../packages/core/PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { fakeLoaderContext } from './__fixtures__/LoaderContext.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/asserts.ts';

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

    asserts.assertEquals(result.pagePath, 'public/dir/foo/654');
    asserts.assertEquals(result.content, content);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            method,
            phase,
            data,
            loaderContext,
            pathname: 'foo/654',
            request,
        }],
        result: content,
    }]);
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

    asserts.assertEquals(result.pagePath, 'public/dir/foo/345');
    asserts.assertEquals(result.content, content);

    asserts.assertEquals(asSpy(page.getDynamicData).calls, [{
        params: [{
            phase: 'generate',
            request: {
                id: '345',
            },
            searchParams,
        }],
        result: data,
    }]);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            method,
            phase: 'generate',
            data: data,
            loaderContext,
            pathname: 'foo/345',
            request: {
                id: '345',
            },
        }],
        result: content,
    }]);
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
