import * as http from '../../../dep/std/http.ts';
import * as datetime from '../../../dep/std/datetime.ts';
import * as mock from '../../../dep/std/mock.ts';
import * as asserts from '../../../dep/std/asserts.ts';

import * as frugal from '../../../packages/core/mod.ts';
import { getMiddleware } from '../../../packages/frugal_server/middleware/postRedirectGet/getMiddleware.ts';
import { RouterContext } from '../../../packages/frugal_server/middleware/types.ts';
import { SESSION_COOKIE_NAME } from '../../../packages/frugal_server/middleware/postRedirectGet/const.ts';

Deno.test('postRedirectGet:getMiddleware: should bail out on non GET request', async () => {
    const next = mock.spy(async () => new Response());
    await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'POST',
        },
    } as RouterContext, next);

    mock.assertSpyCalls(next, 1);
});

Deno.test('postRedirectGet:getMiddleware: should bail out on GET request without expected cookie', async () => {
    const next = mock.spy(async () => new Response());
    await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
            headers: new Headers({
                'Cookie': 'foo=bar',
            }),
        },
    } as RouterContext, next);

    mock.assertSpyCalls(next, 1);
});

Deno.test('postRedirectGet:getMiddleware: should bail out on GET request with expected cookie, but without data', async () => {
    const next = mock.spy(async () => new Response());
    const sessionManagerGet = mock.spy(() => {
        throw new frugal.NotFound('');
    });
    await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
            headers: new Headers({
                'Cookie': `${SESSION_COOKIE_NAME}=sessionId`,
            }),
        },
        sessionManager: {
            get: sessionManagerGet,
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 1);
    mock.assertSpyCalls(sessionManagerGet, 1);
});

Deno.test('postRedirectGet:getMiddleware: should bail out on GET request with expected cookie but without data and remove cookie', async () => {
    const next = mock.spy(async () => new Response());
    const sessionManagerGet = mock.spy(() => {
        throw new frugal.NotFound('');
    });
    const sessionId = 'sessionId';
    const response = await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
            headers: new Headers({
                'Cookie': `${SESSION_COOKIE_NAME}=${sessionId}`,
            }),
        },
        sessionManager: {
            get: sessionManagerGet,
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 1);
    mock.assertSpyCalls(sessionManagerGet, 1);
    mock.assertSpyCall(sessionManagerGet, 0, { args: [sessionId] });
    asserts.assertEquals(
        response.headers.get('Set-Cookie'),
        `${SESSION_COOKIE_NAME}=; Expires=${datetime.toIMF(new Date(0))}`,
    );
});

Deno.test('postRedirectGet:getMiddleware: should answer with data in session', async () => {
    const next = mock.spy(async () => new Response());
    const responseHeaders = {
        'foo': 'bar',
    };
    const responseContent = 'content';
    const sessionManagerGet = mock.spy(() => {
        return JSON.stringify({
            headers: responseHeaders,
            content: responseContent,
        });
    });
    const sessionManagerDelete = mock.spy();
    const sessionId = 'sessionId';
    const response = await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
            headers: new Headers({
                'Cookie': `${SESSION_COOKIE_NAME}=${sessionId}`,
            }),
        },
        sessionManager: {
            get: sessionManagerGet,
            delete: sessionManagerDelete,
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 0);
    mock.assertSpyCalls(sessionManagerGet, 1);
    mock.assertSpyCall(sessionManagerGet, 0, { args: [sessionId] });
    mock.assertSpyCalls(sessionManagerDelete, 1);
    mock.assertSpyCall(sessionManagerDelete, 0, { args: [sessionId] });
    asserts.assertEquals(
        Array.from(response.headers.entries()),
        [
            ['cache-control', 'no-store'],
            ['content-type', 'text/html; charset=utf-8'],
            ['foo', 'bar'],
            [
                'set-cookie',
                `${SESSION_COOKIE_NAME}=; Expires=${
                    datetime.toIMF(new Date(0))
                }`,
            ],
        ],
    );
    asserts.assertEquals(await response.text(), responseContent);
});

Deno.test('postRedirectGet:getMiddleware: default headers can be overriden', async () => {
    const next = mock.spy(async () => new Response());
    const responseHeaders = {
        'cache-control': 'foo',
        'content-type': 'bar',
    };
    const responseContent = 'content';
    const sessionManagerGet = mock.spy(() => {
        return JSON.stringify({
            headers: responseHeaders,
            content: responseContent,
        });
    });
    const sessionManagerDelete = mock.spy();
    const sessionId = 'sessionId';
    const response = await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
            headers: new Headers({
                'Cookie': `${SESSION_COOKIE_NAME}=${sessionId}`,
            }),
        },
        sessionManager: {
            get: sessionManagerGet,
            delete: sessionManagerDelete,
        },
    } as unknown as RouterContext, next);

    asserts.assertEquals(
        Array.from(response.headers.entries()),
        [
            ['cache-control', 'foo'],
            ['content-type', 'bar'],
            [
                'set-cookie',
                `${SESSION_COOKIE_NAME}=; Expires=${
                    datetime.toIMF(new Date(0))
                }`,
            ],
        ],
    );
});
