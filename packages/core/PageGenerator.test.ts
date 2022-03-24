import { PageGenerator } from './PageGenerator.ts';
import { DynamicPage, StaticPage } from './Page.ts';
import { LoaderContext } from './LoaderContext.ts';
import { asSpy, spy } from '../test_util/mod.ts';
import * as asserts from '../../dep/std/asserts.ts';

Deno.test('PageGenerator: generateContentFromData call page.getContent', async () => {
    const page = new DynamicPage({
        self: new URL('file:///'),
        pattern: '',
        getDynamicData() {
            return {};
        },
        getContent() {
            return 'page content';
        },
    });

    const original = page.getContent;
    page.getContent = spy(original.bind(page));

    const loaderContext = new LoaderContext({});

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir: 'public/dir',
        },
    );

    const request = {};

    const result = await generator.generateContentFromData(
        'foo.html',
        {},
        request,
        'build',
    );

    asserts.assertEquals(result.pagePath, 'public/dir/foo.html');
    asserts.assertEquals(result.content, 'page content');

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase: 'build',
            data: {},
            loaderContext,
            pathname: 'foo.html',
            request,
        }],
        result: 'page content',
    }]);
});

Deno.test('PageGenerator: generate orchestrate the generation of DynamicPage', async () => {
    const page = new DynamicPage({
        self: new URL('file:///'),
        pattern: 'foo/:id',
        getDynamicData() {
            return {};
        },
        getContent() {
            return 'page content';
        },
    });

    const originalGetContent = page.getContent;
    page.getContent = spy(originalGetContent.bind(page));

    const originalGetDynamicData = page.getDynamicData;
    page.getDynamicData = spy(originalGetDynamicData.bind(page));

    const loaderContext = new LoaderContext({});

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir: 'public/dir',
        },
    );

    const searchParams = new URLSearchParams();
    const result = await generator.generate('foo/345', searchParams);

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
    const page = new DynamicPage({
        self: new URL('file:///'),
        pattern: 'foo/:id',
        getDynamicData() {
            return {};
        },
        getContent() {
            return 'page content';
        },
    });

    const loaderContext = new LoaderContext({});

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir: 'public/dir',
        },
    );

    const searchParams = new URLSearchParams();

    await asserts.assertRejects(async () => {
        await generator.generate('bar/345', searchParams);
    });
});

Deno.test('PageGenerator: generate throws for StaticPage', async () => {
    const page = new StaticPage({
        self: new URL('file:///'),
        pattern: 'foo/:id',
        getRequestList() {
            return [{}];
        },
        getStaticData() {
            return {};
        },
        getContent() {
            return 'page content';
        },
    });

    const loaderContext = new LoaderContext({});

    const generator = new PageGenerator(
        page,
        {
            loaderContext,
            publicDir: 'public/dir',
        },
    );

    const searchParams = new URLSearchParams();

    await asserts.assertRejects(async () => {
        await generator.generate('bar/345', searchParams);
    });
});
