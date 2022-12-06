import * as http from '../../../dep/std/http.ts';
import * as mock from '../../../dep/std/testing/mock.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';

import * as frugal from '../../../packages/core/mod.ts';
import { cacheMiddleware } from '../../../packages/server/middleware/staticPageMiddleware/cacheMiddleware.ts';
import { RouterContext } from '../../../packages/server/middleware/types.ts';
import { compute } from '../../../packages/server/etag.ts';

Deno.test('cacheMiddleware: should bail out if persistence throw NotFound', async () => {
    const next = mock.spy(() => Promise.resolve(new Response()));

    const request = new Request('http://example.com/foo/bar');
    const pagePersistenceGet = mock.spy(() => {
        throw new frugal.NotFound('');
    });
    await cacheMiddleware({
        frugal: {
            config: {
                publicDir: '/public',
                pagePersistence: {
                    get: pagePersistenceGet,
                },
            },
        },
        request,
    } as unknown as RouterContext<frugal.StaticRoute>, next);

    mock.assertSpyCalls(next, 1);
});

Deno.test('cacheMiddleware: should throw on non NotFound error', () => {
    const next = mock.spy(() => Promise.resolve(new Response()));

    const request = new Request('http://example.com/foo/bar');
    const pagePersistenceGet = mock.spy(() => {
        throw Error();
    });

    asserts.assertRejects(async () => {
        await cacheMiddleware({
            frugal: {
                config: {
                    publicDir: '/public',
                    pagePersistence: {
                        get: pagePersistenceGet,
                    },
                },
            },
            request,
        } as unknown as RouterContext<frugal.StaticRoute>, next);
    });
});

Deno.test('cacheMiddleware: should serve index.html for dir url', async () => {
    const next = mock.spy(() => Promise.resolve(new Response()));

    const request = new Request('http://example.com/foo/bar');
    const pagePersistenceGet = mock.spy((path: string) => {
        if (path.endsWith('.metadata')) {
            return JSON.stringify({ headers: [['foo', 'bar']] });
        }
        return 'content';
    });

    const response = await cacheMiddleware({
        frugal: {
            config: {
                publicDir: '/public',
                pagePersistence: {
                    get: pagePersistenceGet,
                },
            },
        },
        request,
    } as unknown as RouterContext<frugal.StaticRoute>, next);

    mock.assertSpyCalls(next, 0);
    mock.assertSpyCalls(pagePersistenceGet, 2);
    mock.assertSpyCall(pagePersistenceGet, 0, {
        args: ['/public/foo/bar/index.html.metadata'],
    });
    mock.assertSpyCall(pagePersistenceGet, 1, {
        args: ['/public/foo/bar/index.html'],
    });
    asserts.assertEquals(Array.from(response.headers.entries()), [
        ['content-type', 'text/html; charset=utf-8'],
        ['etag', compute('content')],
        ['foo', 'bar'],
    ]);
    asserts.assertEquals(await response.text(), 'content');
});

Deno.test('cacheMiddleware: should serve file for file url', async () => {
    const next = mock.spy(() => Promise.resolve(new Response()));

    const request = new Request('http://example.com/foo/bar.html');
    const pagePersistenceGet = mock.spy((path: string) => {
        if (path.endsWith('.metadata')) {
            return JSON.stringify({ headers: [['foo', 'bar']] });
        }
        return 'content';
    });

    const response = await cacheMiddleware({
        frugal: {
            config: {
                publicDir: '/public',
                pagePersistence: {
                    get: pagePersistenceGet,
                },
            },
        },
        request,
    } as unknown as RouterContext<frugal.StaticRoute>, next);

    mock.assertSpyCalls(next, 0);
    mock.assertSpyCalls(pagePersistenceGet, 2);
    mock.assertSpyCall(pagePersistenceGet, 0, {
        args: ['/public/foo/bar.html.metadata'],
    });
    mock.assertSpyCall(pagePersistenceGet, 1, {
        args: ['/public/foo/bar.html'],
    });
    asserts.assertEquals(await response.text(), 'content');
    asserts.assertEquals(response.status, http.Status.OK);
    asserts.assertEquals(response.statusText, http.STATUS_TEXT[http.Status.OK]);
    asserts.assertEquals(Array.from(response.headers.entries()), [
        ['content-type', 'text/html; charset=utf-8'],
        ['etag', compute('content')],
        ['foo', 'bar'],
    ]);
});

Deno.test('cacheMiddleware: headers can be overwritten', async () => {
    const next = mock.spy(() => Promise.resolve(new Response()));

    const request = new Request('http://example.com/foo/bar.html');
    const pagePersistenceGet = mock.spy((path: string) => {
        if (path.endsWith('.metadata')) {
            return JSON.stringify({
                headers: [
                    ['content-type', 'foo'],
                    ['etag', 'bar'],
                ],
            });
        }
        return 'content';
    });

    const response = await cacheMiddleware({
        frugal: {
            config: {
                publicDir: '/public',
                pagePersistence: {
                    get: pagePersistenceGet,
                },
            },
        },
        request,
    } as unknown as RouterContext<frugal.StaticRoute>, next);

    asserts.assertEquals(Array.from(response.headers.entries()), [
        ['content-type', 'foo'],
        ['etag', 'bar'],
    ]);
    asserts.assertEquals(await response.text(), 'content');
});

Deno.test('cacheMiddleware: return naked status', async () => {
    const next = mock.spy(() => Promise.resolve(new Response()));

    const generated = {
        status: http.Status.NotFound,
        headers: [
            ['foo', 'bar'],
        ],
    };

    const request = new Request('http://example.com/foo/bar.html');
    const pagePersistenceGet = mock.spy((path: string) => {
        if (path.endsWith('.metadata')) {
            return JSON.stringify(generated);
        }
    });

    const response = await cacheMiddleware({
        frugal: {
            config: {
                publicDir: '/public',
                pagePersistence: {
                    get: pagePersistenceGet,
                },
            },
        },
        request,
    } as unknown as RouterContext<frugal.StaticRoute>, next);

    asserts.assertEquals(await response.text(), '');
    asserts.assertEquals(response.status, generated.status);
    asserts.assertEquals(
        response.statusText,
        http.STATUS_TEXT[404],
    );
    asserts.assertEquals(
        Array.from(response.headers.entries()),
        generated.headers,
    );
});
