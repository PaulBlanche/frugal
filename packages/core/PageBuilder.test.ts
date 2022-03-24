import { PageBuilder } from './PageBuilder.ts';
import { PageGenerator } from './PageGenerator.ts';
import { fakeDynamicPage, fakeStaticPage } from './__fixtures__/Page.ts';
import { LoaderContext } from './LoaderContext.ts';
import { Cache } from './Cache.ts';
import { asSpy, FakeFileSystem } from '../test_util/mod.ts';
import * as asserts from '../../dep/std/asserts.ts';

Deno.test('PageBuilder: build query data, generate content and write file', async () => {
    new FakeFileSystem();

    const page = fakeStaticPage({
        pattern: 'foo/:id',
        requestList: [{}],
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    const request = {
        id: '776',
    };
    const phase = 'build';

    const result = await builder.build(request, phase);

    asserts.assertEquals(result, 'public/dir/foo/776');

    asserts.assertEquals(asSpy(page.getStaticData).calls, [{
        params: [{
            phase,
            request,
        }],
        result: {},
    }]);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase,
            data: {},
            loaderContext,
            pathname: 'foo/776',
            request: {
                id: '776',
            },
        }],
        result: 'page content',
    }]);

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            ['public/dir/foo/776', 'page content'],
        ],
    );
});

Deno.test('PageBuilder: build will throw on non matching request', async () => {
    new FakeFileSystem();

    const page = fakeStaticPage({
        pattern: 'foo/:id',
        requestList: [{}],
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    const phase = 'build';

    await asserts.assertRejects(async () => {
        await builder.build({ unknownParameter: '776' }, phase);
    });
});

Deno.test('PageBuilder: buildAll orchestrate the generation of StaticPage', async () => {
    new FakeFileSystem();

    const page = fakeStaticPage({
        pattern: 'foo/:id',
        requestList: [{ id: '1' }, { id: '3' }],
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    await builder.buildAll();

    asserts.assertEquals(asSpy(page.getRequestList).calls, [{
        params: [{
            phase: 'build',
        }],
        result: [{ id: '1' }, { id: '3' }],
    }]);

    asserts.assertEquals(asSpy(page.getStaticData).calls, [{
        params: [{
            phase: 'build',
            request: { id: '1' },
        }],
        result: {},
    }, {
        params: [{
            phase: 'build',
            request: { id: '3' },
        }],
        result: {},
    }]);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase: 'build',
            data: {},
            loaderContext,
            pathname: 'foo/1',
            request: {
                id: '1',
            },
        }],
        result: 'page content',
    }, {
        params: [{
            phase: 'build',
            data: {},
            loaderContext,
            pathname: 'foo/3',
            request: {
                id: '3',
            },
        }],
        result: 'page content',
    }]);

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            ['public/dir/foo/1', 'page content'],
            ['public/dir/foo/3', 'page content'],
        ],
    );
});

Deno.test('PageBuilder: buildAll and build throws on DynamicPage', async () => {
    new FakeFileSystem();

    const page = fakeDynamicPage({
        pattern: 'foo/:id',
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    await asserts.assertRejects(async () => {
        await builder.buildAll();
    });

    await asserts.assertRejects(async () => {
        await builder.build({}, 'build');
    });
});

Deno.test('PageBuilder: build memoize content generation and file writing', async () => {
    new FakeFileSystem();

    const page = fakeStaticPage({
        pattern: 'foo/:id',
        requestList: [{}],
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    const request = {
        id: '776',
    };
    const phase = 'build';

    await builder.build(request, phase);

    const newbuilder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    await newbuilder.build(request, phase);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase,
            data: {},
            loaderContext,
            pathname: 'foo/776',
            request: {
                id: '776',
            },
        }],
        result: 'page content',
    }]);

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            ['public/dir/foo/776', 'page content'],
        ],
    );
});

Deno.test('PageBuilder: build memoize is invalidated on page hash change', async () => {
    new FakeFileSystem();

    const page = fakeStaticPage({
        pattern: 'foo/:id',
        requestList: [{}],
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    const request = {
        id: '776',
    };
    const phase = 'build';

    await builder.build(request, phase);

    const newbuilder = new PageBuilder(
        page,
        'new-hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    await newbuilder.build(request, phase);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase,
            data: {},
            loaderContext,
            pathname: 'foo/776',
            request: {
                id: '776',
            },
        }],
        result: 'page content',
    }, {
        params: [{
            phase,
            data: {},
            loaderContext,
            pathname: 'foo/776',
            request: {
                id: '776',
            },
        }],
        result: 'page content',
    }]);

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            ['public/dir/foo/776', 'page content'],
            ['public/dir/foo/776', 'page content'],
        ],
    );
});

Deno.test('PageBuilder: build memoize is invalidated on data change', async () => {
    new FakeFileSystem();

    const data = { current: { foo: 1 } };

    const page = fakeStaticPage({
        pattern: 'foo/:id',
        requestList: [{}],
        data: () => data.current,
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    const request = {
        id: '776',
    };
    const phase = 'build';

    await builder.build(request, phase);

    data.current = { foo: 2 };
    const newbuilder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    await newbuilder.build(request, phase);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase,
            data: { foo: 1 },
            loaderContext,
            pathname: 'foo/776',
            request: {
                id: '776',
            },
        }],
        result: 'page content',
    }, {
        params: [{
            phase,
            data: { foo: 2 },
            loaderContext,
            pathname: 'foo/776',
            request: {
                id: '776',
            },
        }],
        result: 'page content',
    }]);

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            ['public/dir/foo/776', 'page content'],
            ['public/dir/foo/776', 'page content'],
        ],
    );
});

Deno.test('PageBuilder: build memoize is invalidated on url change', async () => {
    new FakeFileSystem();

    const page = fakeStaticPage({
        pattern: 'foo/:id',
        requestList: [{}],
        data: {},
        content: 'page content',
    });

    const loaderContext = new LoaderContext({});
    const publicDir = 'public/dir';
    const cache = Cache.unserialize({});

    const builder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    const phase = 'build';

    await builder.build({ id: '776' }, phase);

    const newbuilder = new PageBuilder(
        page,
        'hash',
        new PageGenerator(page, {
            loaderContext,
            publicDir,
        }),
        {
            cache,
        },
    );

    await newbuilder.build({ id: '123' }, phase);

    asserts.assertEquals(asSpy(page.getContent).calls, [{
        params: [{
            phase,
            data: {},
            loaderContext,
            pathname: 'foo/776',
            request: {
                id: '776',
            },
        }],
        result: 'page content',
    }, {
        params: [{
            phase,
            data: {},
            loaderContext,
            pathname: 'foo/123',
            request: {
                id: '123',
            },
        }],
        result: 'page content',
    }]);

    asserts.assertEquals(
        asSpy(Deno.writeTextFile).calls.map((call) => call.params),
        [
            ['public/dir/foo/776', 'page content'],
            ['public/dir/foo/123', 'page content'],
        ],
    );
});
