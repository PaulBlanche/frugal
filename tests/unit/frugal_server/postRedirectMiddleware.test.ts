import * as http from '../../../dep/std/http.ts';
import * as mock from '../../../dep/std/mock.ts';
import * as asserts from '../../../dep/std/asserts.ts';

import { postRedirectMiddleware } from '../../../packages/frugal_server/middleware/postRedirectGet/postRedirectMiddleware.ts';
import { RouterContext } from '../../../packages/frugal_server/middleware/types.ts';
import { SESSION_COOKIE_NAME } from '../../../packages/frugal_server/middleware/postRedirectGet/const.ts';

Deno.test('postRedirectGet:postRedirectMiddleware: should bail out on invalid methods', async () => {
    for (const method of ['HEAD', 'OPTIONS', 'GET']) {
        const next = mock.spy(async () => new Response());
        await postRedirectMiddleware({
            request: {
                url: 'http://example.com',
                method,
            },
        } as RouterContext, next);

        mock.assertSpyCalls(next, 1);
    }
});

Deno.test('postRedirectGet:postRedirectMiddleware: should generate and store in session on valid methods', async () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        const next = mock.spy(async () => new Response());
        const sessionId = 'sessionId';
        const sessionManagerSet = mock.spy(() => {
            return sessionId;
        });
        const generated = {
            pagePath: '',
            content: 'page-content',
            headers: new Headers({
                page: 'header',
            }),
        };
        const response = await postRedirectMiddleware({
            request: {
                url: 'http://example.com',
                method,
            },
            sessionManager: {
                set: sessionManagerSet,
            },
            route: {
                generator: {
                    generate: mock.spy(async () => generated),
                },
            },
        } as unknown as RouterContext, next);

        mock.assertSpyCalls(next, 0);
        mock.assertSpyCalls(sessionManagerSet, 1);
        mock.assertSpyCall(sessionManagerSet, 0, {
            args: [JSON.stringify({
                content: generated.content,
                headers: Array.from(generated.headers.entries()),
            })],
        });
        asserts.assertEquals(response.status, http.Status.SeeOther);
        asserts.assertEquals(
            response.statusText,
            http.STATUS_TEXT[http.Status.SeeOther],
        );
        asserts.assertEquals(Array.from(response.headers.entries()), [
            ['location', 'http://example.com/'],
            ['set-cookie', `${SESSION_COOKIE_NAME}=${sessionId}`],
        ]);
    }
});

Deno.test('postRedirectGet:postRedirectMiddleware: return naked status', async () => {
    const generated = {
        status: http.Status.NotFound,
        headers: {
            'foo': 'bar',
        },
    };

    const next = mock.spy(async () => new Response());

    const response = await postRedirectMiddleware({
        request: {
            url: 'http://example.com',
            method: 'POST',
        },
        route: {
            generator: {
                generate: mock.spy(async () => generated),
            },
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 0);

    asserts.assertEquals(await response.text(), '');
    asserts.assertEquals(response.status, generated.status);
    asserts.assertEquals(
        response.statusText,
        http.STATUS_TEXT[generated.status],
    );
    asserts.assertEquals(Array.from(response.headers.entries()), [
        ...Object.entries(generated.headers),
    ]);
});
