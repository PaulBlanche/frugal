import * as http from '../../../dep/std/http.ts';
import * as datetime from '../../../dep/std/datetime.ts';
import * as mock from '../../../dep/std/mock.ts';
import * as asserts from '../../../dep/std/asserts.ts';

import * as frugal from '../../../packages/core/mod.ts';
import { getMiddleware } from '../../../packages/server/middleware/postRedirectGet/getMiddleware.ts';
import { RouterContext } from '../../../packages/server/middleware/types.ts';
import { SESSION_KEY } from '../../../packages/server/middleware/postRedirectGet/const.ts';

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

Deno.test('postRedirectGet:getMiddleware: should bail out on GET request without expected value in session', async () => {
    const next = mock.spy(async () => new Response());
    const sessionHas = mock.spy(() => false);
    await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
        },
        session: {
            has: sessionHas,
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 1);
    mock.assertSpyCalls(sessionHas, 1);
    mock.assertSpyCall(sessionHas, 0, {
        args: [SESSION_KEY],
    });
});

Deno.test('postRedirectGet:getMiddleware: should bail out and remove session value on GET request with expected value in session, but without data', async () => {
    const next = mock.spy(async () => new Response());
    const sessionHas = mock.spy(() => true);
    const sessionUnset = mock.spy();
    const sessionRead = mock.spy(() => {
        throw new frugal.NotFound('');
    });
    await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
        },
        session: {
            has: sessionHas,
            read: sessionRead,
            unset: sessionUnset,
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 1);
    mock.assertSpyCalls(sessionHas, 1);
    mock.assertSpyCall(sessionHas, 0, {
        args: [SESSION_KEY],
    });
    mock.assertSpyCalls(sessionRead, 1);
    mock.assertSpyCall(sessionRead, 0, {
        args: [SESSION_KEY],
    });
    mock.assertSpyCalls(sessionUnset, 1);
    mock.assertSpyCall(sessionUnset, 0, {
        args: [SESSION_KEY],
    });
});

Deno.test('postRedirectGet:getMiddleware: should throw on non NotFound error in session read', async () => {
    const next = mock.spy(async () => new Response());
    const sessionHas = mock.spy(() => true);
    const sessionRead = mock.spy(() => {
        throw new Error();
    });

    await asserts.assertRejects(async () => {
        await getMiddleware({
            request: {
                url: 'http://example.com',
                method: 'GET',
            },
            session: {
                has: sessionHas,
                read: sessionRead,
            },
        } as unknown as RouterContext, next);
    });
});

Deno.test('postRedirectGet:getMiddleware: should answer with data in session', async () => {
    const next = mock.spy(async () => new Response());
    const responseHeaders = {
        'foo': 'bar',
    };
    const responseContent = 'content';

    const sessionHas = mock.spy(() => true);
    const sessionUnset = mock.spy();
    const sessionRead = mock.spy(() => {
        return JSON.stringify({
            headers: responseHeaders,
            content: responseContent,
        });
    });
    const sessionDelete = mock.spy();

    const response = await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
        },
        session: {
            has: sessionHas,
            read: sessionRead,
            unset: sessionUnset,
            delete: sessionDelete,
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 0);
    mock.assertSpyCalls(sessionHas, 1);
    mock.assertSpyCall(sessionHas, 0, { args: [SESSION_KEY] });
    mock.assertSpyCalls(sessionRead, 1);
    mock.assertSpyCall(sessionRead, 0, { args: [SESSION_KEY] });
    mock.assertSpyCalls(sessionUnset, 1);
    mock.assertSpyCall(sessionUnset, 0, { args: [SESSION_KEY] });
    mock.assertSpyCalls(sessionDelete, 1);
    mock.assertSpyCall(sessionDelete, 0, { args: [SESSION_KEY] });
    asserts.assertEquals(
        Array.from(response.headers.entries()),
        [
            ['cache-control', 'no-store'],
            ['content-type', 'text/html; charset=utf-8'],
            ['foo', 'bar'],
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

    const sessionHas = mock.spy(() => true);
    const sessionUnset = mock.spy();
    const sessionRead = mock.spy(() => {
        return JSON.stringify({
            headers: responseHeaders,
            content: responseContent,
        });
    });
    const sessionDelete = mock.spy();

    const response = await getMiddleware({
        request: {
            url: 'http://example.com',
            method: 'GET',
        },
        session: {
            has: sessionHas,
            read: sessionRead,
            unset: sessionUnset,
            delete: sessionDelete,
        },
    } as unknown as RouterContext, next);

    asserts.assertEquals(
        Array.from(response.headers.entries()),
        [
            ['cache-control', 'foo'],
            ['content-type', 'bar'],
        ],
    );
});
