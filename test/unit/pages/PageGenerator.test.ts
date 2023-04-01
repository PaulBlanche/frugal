import { PageGenerator } from '../../../src/page/PageGenerator.ts';
import * as fixture from './__fixtures__.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';
import * as mock from '../../../dep/std/testing/mock.ts';
import {
  DataResponse,
  EmptyResponse,
} from '../../../src/page/FrugalResponse.ts';

Deno.test('PageGenerator: generateContentFromData call page.getContent', async () => {
  const page = fixture.fakeDynamicPage({
    self: 'file:///foo/bar/page.ts',
    pattern: 'foo/:id',
  });

  const content = 'page content';
  const pageGetContentStub = mock.stub(page, 'getContent', () => content);

  const assets = {};
  const descriptor = 'bar.pages.ts';
  const generator = new PageGenerator({
    page,
    assets,
    descriptor,
  });

  const path = { id: '654' };
  const data = {};
  const pathname = 'foo/654';
  const phase = 'generate';
  const method = 'GET';

  const result = await generator.render(
    pathname,
    {
      method,
      data,
      path,
      phase,
    },
  );

  asserts.assertEquals(result, content);

  mock.assertSpyCalls(pageGetContentStub, 1);
  mock.assertSpyCall(pageGetContentStub, 0, {
    args: [{
      method,
      phase,
      data,
      assets,
      pathname,
      path,
      descriptor,
    }],
  });
});

Deno.test('PageGenerator: generate orchestrate the generation of DynamicPage', async (t) => {
  type Data = {
    content: string;
  };
  const store: Record<
    string,
    { data?: Data; headers?: HeadersInit; status?: number }
  > = {
    '345': {
      data: { content: 'page content' },
      headers: [['baz', 'foobar']],
    },
    '325': {
      status: 300,
      headers: [['baz', 'foobar']],
    },
  };

  const page = fixture.fakeDynamicPage<Data, '/foo/:id'>({
    self: 'file:///foo/bar/page.ts',
    pattern: '/foo/:id',
  });

  const pageGETStub = mock.stub(
    page,
    'GET',
    ({ path: { id } }) => {
      const entry = store[id];
      return entry.data === undefined
        ? new EmptyResponse({
          headers: entry.headers,
          status: entry.status,
        })
        : new DataResponse(entry.data, {
          headers: entry.headers,
          status: entry.status,
        });
    },
  );
  const pageGetContentStub = mock.stub(
    page,
    'getContent',
    ({ data: { content } }) => content,
  );

  const assets = {};
  const descriptor = 'bar/page.ts';
  const generator = new PageGenerator({
    page,
    assets,
    descriptor,
  });

  const originalGeneratorRender = generator.render.bind(generator);
  const generatorRenderSpy = mock.stub(
    generator,
    'render',
    originalGeneratorRender,
  );

  await t.step('data response', async () => {
    const request = new Request(new URL('http://0.0.0.0/foo/345'), {
      method: 'GET',
    });

    const state = {};
    const result = await generator.generate(request, state);

    // render was called because response had data
    mock.assertSpyCalls(generatorRenderSpy, 1);

    asserts.assertEquals(result.body, 'page content');
    asserts.assertEquals(
      Array.from(result.headers.entries()),
      store['345'].headers,
    );
    asserts.assertEquals(result.status, 200);

    mock.assertSpyCalls(pageGETStub, 1);
    mock.assertSpyCall(pageGETStub, 0, {
      args: [{
        request,
        phase: 'generate',
        path: {
          id: '345',
        },
        state,
      }],
    });

    mock.assertSpyCalls(pageGetContentStub, 1);
    mock.assertSpyCall(pageGetContentStub, 0, {
      args: [{
        method: request.method,
        phase: 'generate',
        data: store['345'].data as Data,
        assets,
        pathname: new URL(request.url).pathname,
        path: {
          id: '345',
        },
        descriptor,
      }],
    });

    // reset spies for next test
    generatorRenderSpy.calls.length = 0;
    pageGetContentStub.calls.length = 0;
    pageGETStub.calls.length = 0;
  });

  await t.step('empty response', async () => {
    const request = new Request(new URL('http://0.0.0.0/foo/325'), {
      method: 'GET',
    });

    const state = {};
    const result = await generator.generate(request, state);

    // render was called because response had data
    mock.assertSpyCalls(generatorRenderSpy, 0);

    asserts.assertEquals(result.body, undefined);
    asserts.assertEquals(
      Array.from(result.headers.entries()),
      store['325'].headers,
    );
    asserts.assertEquals(result.status, store['325'].status);

    mock.assertSpyCalls(pageGETStub, 1);
    mock.assertSpyCall(pageGETStub, 0, {
      args: [{
        request,
        phase: 'generate',
        path: {
          id: '325',
        },
        state,
      }],
    });

    mock.assertSpyCalls(pageGetContentStub, 0);

    // reset spies for next test
    generatorRenderSpy.calls.length = 0;
    pageGetContentStub.calls.length = 0;
    pageGETStub.calls.length = 0;
  });
});

Deno.test('PageGenerator: generate throws if pathname does not match', async () => {
  const page = fixture.fakeDynamicPage({
    pattern: '/bar/:id',
  });

  const assets = {};
  const descriptor = 'bar/page.ts';
  const generator = new PageGenerator({
    page,
    assets,
    descriptor,
  });

  const request = new Request(new URL('http://0.0.0.0/foo/345'), {
    method: 'GET',
  });

  const state = {};

  await asserts.assertRejects(async () => {
    await generator.generate(request, state);
  });
});

Deno.test('PageGenerator: generate throws for StaticPage', async () => {
  const page = fixture.fakeStaticPage({});

  const assets = {};
  const descriptor = 'bar/page.ts';
  const generator = new PageGenerator({
    page,
    assets,
    descriptor,
  });

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
  const page = fixture.fakeStaticPage<{ foo: string }>({
    self: 'file:///foo/bar/page.ts',
    pattern: '/foo/:id',
  });
  const pageGETstub = mock.stub(page, 'GET', () => new DataResponse(data));
  const pageGetContentStub = mock.stub(page, 'getContent', () => content);

  const assets = {};
  const descriptor = 'bar/page.ts';
  const generator = new PageGenerator({
    page,
    assets,
    descriptor,
    watch: true,
  });

  const request = new Request(new URL('http://0.0.0.0/foo/345'), {
    method: 'GET',
  });

  const state = {};
  const result = await generator.generate(request, state);

  asserts.assertEquals(result.body, 'page content');
  asserts.assertEquals(Array.from(result.headers.entries()), []);
  asserts.assertEquals(result.status, 200);

  mock.assertSpyCalls(pageGETstub, 1);
  mock.assertSpyCall(pageGETstub, 0, {
    args: [{
      request,
      phase: 'generate',
      path: {
        id: '345',
      },
      state,
      // deno-lint-ignore no-explicit-any
    } as any],
    returned: new DataResponse(data),
  });

  mock.assertSpyCalls(pageGetContentStub, 1);
  mock.assertSpyCall(pageGetContentStub, 0, {
    args: [{
      method: request.method,
      phase: 'generate',
      data: data,
      assets,
      pathname: new URL(request.url).pathname,
      path: {
        id: '345',
      },
      descriptor,
    }],
    returned: content,
  });
});

Deno.test('PageGenerator: generate generates pages with POST request', async (t) => {
  const content = 'page content';
  const data = { foo: 'bar' };

  const assets = {};
  const descriptor = 'bar/page.ts';

  const request = new Request(new URL('http://0.0.0.0/foo/345'), {
    method: 'POST',
  });

  const state = {};

  await t.step('DynamicPage', async () => {
    const page = fixture.fakeDynamicPage({
      self: 'file:///foo/bar/page.ts',
      pattern: '/foo/:id',
      getContent: () => content,
    });
    const pagePOSTStub = mock.stub(page, 'POST', () => new DataResponse(data));
    const pageGetContentStub = mock.stub(page, 'getContent', () => content);

    const generator = new PageGenerator({
      page: page,
      assets,
      descriptor,
    });

    const result = await generator.generate(request, state);

    asserts.assertEquals(result.body, content);
    asserts.assertEquals(Array.from(result.headers.entries()), []);
    asserts.assertEquals(result.status, 200);

    mock.assertSpyCalls(pagePOSTStub, 1);
    mock.assertSpyCall(pagePOSTStub, 0, {
      args: [{
        request,
        phase: 'generate',
        path: {
          id: '345',
        },
        state,
      }],
      returned: new DataResponse(data),
    });

    mock.assertSpyCalls(pageGetContentStub, 1);
    mock.assertSpyCall(pageGetContentStub, 0, {
      args: [{
        method: request.method,
        phase: 'generate',
        data: data,
        assets,
        pathname: new URL(request.url).pathname,
        path: {
          id: '345',
        },
        descriptor,
      }],
      returned: content,
    });
  });

  await t.step('StaticPage', async () => {
    const page = fixture.fakeStaticPage({
      self: 'file:///foo/bar/page.ts',
      pattern: '/foo/:id',
    });
    const pagePOSTStub = mock.stub(page, 'POST', () => new DataResponse(data));
    const pageGetContentStub = mock.stub(page, 'getContent', () => content);

    const generator = new PageGenerator({
      page: page,
      assets,
      descriptor,
    });

    const result = await generator.generate(request, state);

    asserts.assertEquals(result.body, content);
    asserts.assertEquals(Array.from(result.headers.entries()), []);
    asserts.assertEquals(result.status, 200);

    mock.assertSpyCalls(pagePOSTStub, 1);
    mock.assertSpyCall(pagePOSTStub, 0, {
      args: [{
        request,
        phase: 'generate',
        path: {
          id: '345',
        },
        state,
      }],
      returned: new DataResponse(data),
    });

    mock.assertSpyCalls(pageGetContentStub, 1);
    mock.assertSpyCall(pageGetContentStub, 0, {
      args: [{
        method: request.method,
        phase: 'generate',
        data: data,
        assets,
        pathname: new URL(request.url).pathname,
        path: {
          id: '345',
        },
        descriptor,
      }],
      returned: content,
    });
  });
});
