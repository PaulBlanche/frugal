import * as frugal from '../../../packages/core/mod.ts';
import * as path from '../../../dep/std/path.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';
import * as mock from '../../../dep/std/testing/mock.ts';

import { Hash } from '../../../packages/murmur/mod.ts';
import { PageDescriptorError } from '../../../packages/core/Page.ts';

Deno.test('page: bare static page', async () => {
    const content = `${Math.random()}`;

    const page = {
        pattern: 'bare-static-page',
        self: new URL(import.meta.url),
        getContent: mock.spy(() => {
            return content;
        }),
    };

    const config = {
        outputDir: dist(),
        pages: [frugal.page(page)],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    mock.assertSpyCalls(page.getContent, 1);
    mock.assertSpyCall(page.getContent, 0, {
        args: [{
            data: {},
            descriptor: 'pages.test.ts',
            method: 'GET',
            path: {},
            pathname: 'bare-static-page',
            loaderContext: new frugal.LoaderContext({}),
            phase: 'build',
        }],
    });

    const pageContent = await Deno.readTextFile(
        publicFileUrl(instance, 'bare-static-page/index.html'),
    );
    asserts.assertEquals(pageContent, content);

    await instance.clean();
});

Deno.test('page: static page without getPathList', async () => {
    const content = `${Math.random()}`;
    const data = Math.random();
    const headers: [string, string][] = [[
        `${Math.random()}`,
        `${Math.random()}`,
    ]];

    const page = {
        pattern: 'static-page-without-getpathlist',
        self: new URL(import.meta.url),
        getContent: mock.spy(() => {
            return content;
        }),
        getStaticData: mock.spy(() => {
            return { data, headers };
        }),
    };

    const config = {
        outputDir: dist(),
        pages: [frugal.page(page)],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    mock.assertSpyCalls(page.getStaticData, 1);
    mock.assertSpyCall(page.getStaticData, 0, {
        args: [{
            path: {},
            phase: 'build',
        }],
    });
    mock.assertSpyCalls(page.getContent, 1);
    mock.assertSpyCall(page.getContent, 0, {
        args: [{
            data,
            descriptor: 'pages.test.ts',
            method: 'GET',
            path: {},
            pathname: 'static-page-without-getpathlist',
            loaderContext: new frugal.LoaderContext({}),
            phase: 'build',
        }],
    });

    const pageContent = await Deno.readTextFile(
        publicFileUrl(instance, 'static-page-without-getpathlist/index.html'),
    );
    asserts.assertEquals(pageContent, content);
    const pageMetadata = await Deno.readTextFile(
        publicFileUrl(
            instance,
            'static-page-without-getpathlist/index.html.metadata',
        ),
    );
    asserts.assertEquals(JSON.parse(pageMetadata), { headers });

    await instance.clean();
});

Deno.test('page: static page without getPathList with url parameter', async () => {
    const content = `${Math.random()}`;

    const page = {
        pattern: 'bare-static-page/:id',
        self: new URL(import.meta.url),
        getContent: mock.spy(() => {
            return content;
        }),
    };

    const config = {
        outputDir: dist(),
        pages: [frugal.page(page)],
    };

    const instance = await getFrugalInstance(config);

    await asserts.assertRejects(
        async () => {
            await instance.build();
        },
        PageDescriptorError,
        'Error while compiling pattern "bare-static-page/:id" with path "{}": Expected "id" to be a string',
    );

    await instance.clean();
});

Deno.test('page: static page without getStaticData', async () => {
    const content: Record<string, string> = {
        '1': `${Math.random()}`,
        '2': `${Math.random()}`,
    };

    const page = {
        pattern: 'static-page-without-getstaticdata/:id',
        self: new URL(import.meta.url),
        getContent: mock.spy(
            ({ path }: frugal.GetContentParams<{ id: string }>) => {
                return content[path.id];
            },
        ),
        getPathList: mock.spy(() => {
            return [{ id: '1' }, { id: '2' }];
        }),
    };

    const config = {
        outputDir: dist(),
        pages: [frugal.page(page)],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    mock.assertSpyCalls(page.getPathList, 1);
    mock.assertSpyCall(page.getPathList, 0, { args: [{ phase: 'build' }] });
    mock.assertSpyCalls(page.getContent, 2);
    mock.assertSpyCall(page.getContent, 0, {
        args: [{
            data: {},
            descriptor: 'pages.test.ts',
            method: 'GET',
            path: { id: '1' },
            pathname: 'static-page-without-getstaticdata/1',
            loaderContext: new frugal.LoaderContext({}),
            phase: 'build',
        }],
    });
    mock.assertSpyCall(page.getContent, 1, {
        args: [{
            data: {},
            descriptor: 'pages.test.ts',
            method: 'GET',
            path: { id: '2' },
            pathname: 'static-page-without-getstaticdata/2',
            loaderContext: new frugal.LoaderContext({}),
            phase: 'build',
        }],
    });

    const page1Content = await Deno.readTextFile(
        publicFileUrl(
            instance,
            'static-page-without-getstaticdata/1/index.html',
        ),
    );
    asserts.assertEquals(page1Content, content['1']);
    const page2Content = await Deno.readTextFile(
        publicFileUrl(
            instance,
            'static-page-without-getstaticdata/2/index.html',
        ),
    );
    asserts.assertEquals(page2Content, content['2']);

    await instance.clean();
});

Deno.test('page: complete static page', async () => {
    // deno-lint-ignore no-explicit-any
    const store: Record<string, any> = {
        '1': {
            data: Math.random(),
            headers: [[`${Math.random()}`, `${Math.random()}`]],
            content: `${Math.random()}`,
        },
        '2': {
            data: Math.random(),
            headers: [[`${Math.random()}`, `${Math.random()}`]],
            content: `${Math.random()}`,
        },
    };

    const page = {
        pattern: 'complete-static-page/:id',
        self: new URL(import.meta.url),
        getContent: mock.spy(
            (params: frugal.GetContentParams<{ id: string }>) => {
                return store[params.path.id].content;
            },
        ),
        getPathList: mock.spy(() => {
            return [{ id: '1' }, { id: '2' }];
        }),
        getStaticData: mock.spy(
            (params: frugal.GetStaticDataContext<{ id: string }>) => {
                return {
                    data: store[params.path.id].data,
                    headers: store[params.path.id].headers,
                };
            },
        ),
    };

    const config = {
        outputDir: dist(),
        pages: [frugal.page(page)],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    mock.assertSpyCalls(page.getPathList, 1);
    mock.assertSpyCall(page.getPathList, 0, { args: [{ phase: 'build' }] });
    mock.assertSpyCalls(page.getStaticData, 2);
    mock.assertSpyCall(page.getStaticData, 0, {
        args: [{
            path: { id: '1' },
            phase: 'build',
        }],
    });
    mock.assertSpyCall(page.getStaticData, 1, {
        args: [{
            path: { id: '2' },
            phase: 'build',
        }],
    });
    mock.assertSpyCalls(page.getContent, 2);
    mock.assertSpyCall(page.getContent, 0, {
        args: [{
            data: store['1'].data,
            descriptor: 'pages.test.ts',
            method: 'GET',
            path: { id: '1' },
            pathname: 'complete-static-page/1',
            loaderContext: new frugal.LoaderContext({}),
            phase: 'build',
        }],
    });
    mock.assertSpyCall(page.getContent, 1, {
        args: [{
            data: store['2'].data,
            descriptor: 'pages.test.ts',
            method: 'GET',
            path: { id: '2' },
            pathname: 'complete-static-page/2',
            loaderContext: new frugal.LoaderContext({}),
            phase: 'build',
        }],
    });

    const page1Content = await Deno.readTextFile(
        publicFileUrl(instance, 'complete-static-page/1/index.html'),
    );
    asserts.assertEquals(page1Content, store['1'].content);
    const page1Metadata = await Deno.readTextFile(
        publicFileUrl(instance, 'complete-static-page/1/index.html.metadata'),
    );
    asserts.assertEquals(JSON.parse(page1Metadata), {
        headers: store['1'].headers,
    });

    const page2Content = await Deno.readTextFile(
        publicFileUrl(instance, 'complete-static-page/2/index.html'),
    );
    asserts.assertEquals(page2Content, store['2'].content);
    const page2Metadata = await Deno.readTextFile(
        publicFileUrl(instance, 'complete-static-page/2/index.html.metadata'),
    );
    asserts.assertEquals(JSON.parse(page2Metadata), {
        headers: store['2'].headers,
    });

    await instance.clean();
});

Deno.test('page: dynamic page is not generated', async () => {
    const content = `${Math.random()}`;
    const data = Math.random();
    const headers: [string, string][] = [[
        `${Math.random()}`,
        `${Math.random()}`,
    ]];

    const page = {
        pattern: 'complete-static-page/:id',
        self: new URL(import.meta.url),
        getDynamicData: mock.spy(() => {
            return { data, headers };
        }),
        getContent: mock.spy(() => {
            return content;
        }),
    };

    const config = {
        outputDir: dist(),
        pages: [frugal.page(page)],
    };

    const instance = await getFrugalInstance(config);
    await instance.build();

    mock.assertSpyCalls(page.getDynamicData, 0);
    mock.assertSpyCalls(page.getContent, 0);

    await instance.clean();
});

async function getFrugalInstance(
    config: Pick<frugal.Config, 'pages' | 'outputDir'>,
) {
    const instance = await new frugal.FrugalBuilder({
        self: new URL(import.meta.url),
        outputDir: config.outputDir,
        pages: config.pages,
        logging: frugal.OFF_LOGGER_CONFIG,
    }).create();

    return instance;
}

function dist() {
    return `./dist-${new Hash().update(String(Math.random())).digest()}`;
}

function relativeUrl(file: string) {
    return new URL(file, import.meta.url);
}

function publicFileUrl(frugal: frugal.Frugal, file: string) {
    return relativeUrl(
        path.join(frugal.config.publicDir, file),
    );
}
