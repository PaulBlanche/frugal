import { PageGenerator } from './PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { LoaderContext } from './LoaderContext.ts';
import { asSpy } from '../test_util/mod.ts';
import * as asserts from '../../dep/std/asserts.ts';

Deno.test('PageGenerator: generateContentFromData call page.getContent', async () => {
    const page = fakeDynamicPage({
        pattern: 'foo/:id',
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
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

    const result = await generator.generateContentFromData(
        pathName,
        data,
        request,
        phase,
    );

    asserts.assertEquals(result.pagePath, 'public/dir/foo/654');
    asserts.assertEquals(result.content, 'page content');

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase,
            data,
            loaderContext,
            pathname: 'foo/654',
            request,
        }],
        result: 'page content',
    }]);
});

Deno.test('PageGenerator: generate orchestrate the generation of DynamicPage', async () => {
    const page = fakeDynamicPage({
        pattern: 'foo/:id',
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
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

    const result = await generator.generate(pathName, searchParams);

    asserts.assertEquals(result.pagePath, 'public/dir/foo/345');
    asserts.assertEquals(result.content, 'page content');

    asserts.assertEquals(asSpy(page.getDynamicData).calls, [{
        params: [{
            phase: 'generate',
            request: {
                id: '345',
            },
            searchParams,
        }],
        result: {},
    }]);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase: 'generate',
            data: {},
            loaderContext,
            pathname: 'foo/345',
            request: {
                id: '345',
            },
        }],
        result: 'page content',
    }]);
});

Deno.test('PageGenerator: generate throws if pathname does not match', async () => {
    const page = fakeDynamicPage({
        pattern: 'foo/:id',
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
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
        await generator.generate(pathName, searchParams);
    });
});

Deno.test('PageGenerator: generate throws for StaticPage', async () => {
    const page = fakeStaticPage({
        pattern: 'foo/:id',
        data: {},
        content: 'page content',
        requestList: [{}],
    });

    const loaderContext = new LoaderContext({});
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
        await generator.generate(pathName, searchParams);
    });
});
