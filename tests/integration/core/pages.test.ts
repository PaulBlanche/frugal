import * as frugal from '../../../packages/core/mod.ts';
import * as path from '../../../dep/std/path.ts';
import * as asserts from '../../../dep/std/asserts.ts';
import * as mock from '../../../dep/std/mock.ts';

import { Hash } from '../../../packages/murmur/mod.ts';
import { PageDescriptorError } from '../../../packages/core/Page.ts';

Deno.test('page: bare static page', async (t) => {
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
            descriptor: new URL(import.meta.url),
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

Deno.test('page: static page without getPathList', async (t) => {
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
            descriptor: new URL(import.meta.url),
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

Deno.test('page: static page without getPathList with url parameter', async (t) => {
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

Deno.test('page: static page without getStaticData', async (t) => {
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
            descriptor: new URL(import.meta.url),
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
            descriptor: new URL(import.meta.url),
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

Deno.test('page: complete static page', async (t) => {
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
            descriptor: new URL(import.meta.url),
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
            descriptor: new URL(import.meta.url),
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

Deno.test('page: dynamic page is not generated', async (t) => {
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

/*

*/

/*
Deno.test('Basic usage: file structure', async (t) => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
        ],
    };

    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const pageFoo1 = await Deno.readTextFile(
        publicFileUrl(frugal, 'foo/1.html'),
    );
    const pageFoo2 = await Deno.readTextFile(
        publicFileUrl(frugal, 'foo/2.html'),
    );

    const pageBar1 = await Deno.readTextFile(
        publicFileUrl(frugal, 'bar/1.html'),
    );
    const pageBar2 = await Deno.readTextFile(
        publicFileUrl(frugal, 'bar/2.html'),
    );

    // assert file content
    await assertSnapshot(t, pageFoo1);
    await assertSnapshot(t, pageFoo2);
    await assertSnapshot(t, pageBar1);
    await assertSnapshot(t, pageBar2);

    await frugal.clean();
});

Deno.test('Basic usage: files are not regenerated if nothing changes', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert filew where not rewritten on second run
    asserts.assertEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await frugal.clean();
});

Deno.test('Basic usage: files are regenerated if page code change', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    const originalData = await Deno.readTextFile(relativeUrl('./page-foo.ts'));
    await Deno.writeTextFile(
        relativeUrl('./page-foo.ts'),
        `//comment\n${originalData}`,
    );

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert filew where overwritten on second run
    asserts.assertNotEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertNotEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await Deno.writeTextFile(relativeUrl('./page-foo.ts'), originalData);
    await frugal.clean();
});

Deno.test('Basic usage: files are regenerated if code of dependency change', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    const originalData = await Deno.readTextFile(relativeUrl('./article.ts'));
    await Deno.writeTextFile(
        relativeUrl('./article.ts'),
        `//comment\n${originalData}`,
    );

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert filew where overwritten on second run
    asserts.assertNotEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertNotEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertNotEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertNotEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await Deno.writeTextFile(relativeUrl('./article.ts'), originalData);
    await frugal.clean();
});

Deno.test('Basic usage: files are regenerated if data change', async () => {
    const config = {
        outputDir: dist(),
        pages: [
            page(pageFoo),
        ],
    };
    const frugal = await getFrugalInstance(config);

    await frugal.build();

    const stat1Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat1Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat1Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat1Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    const originalData = await Deno.readTextFile(relativeUrl('./data.json'));
    const data = JSON.parse(originalData);
    data['foo']['2']['title'] = `${data['foo']['2']['title']} (edited)`;
    await Deno.writeTextFile(relativeUrl('./data.json'), JSON.stringify(data));

    await (await getFrugalInstance(config)).build();

    const stat2Foo1 = await Deno.stat(publicFileUrl(frugal, 'foo/1.html'));
    const stat2Foo2 = await Deno.stat(publicFileUrl(frugal, 'foo/2.html'));
    const stat2Bar1 = await Deno.stat(publicFileUrl(frugal, 'bar/1.html'));
    const stat2Bar2 = await Deno.stat(publicFileUrl(frugal, 'bar/2.html'));

    // assert files where overwritten on second run
    asserts.assertEquals(stat1Foo1.mtime, stat2Foo1.mtime);
    asserts.assertNotEquals(stat1Foo2.mtime, stat2Foo2.mtime);
    asserts.assertEquals(stat1Bar1.mtime, stat2Bar1.mtime);
    asserts.assertEquals(stat1Bar2.mtime, stat2Bar2.mtime);

    await Deno.writeTextFile(relativeUrl('./data.json'), originalData);
    await frugal.clean();
});*/

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
