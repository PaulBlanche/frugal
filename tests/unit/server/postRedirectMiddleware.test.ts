import * as http from '../../../dep/std/http.ts';
import * as mock from '../../../dep/std/testing/mock.ts';
import * as asserts from '../../../dep/std/testing/asserts.ts';

import { postRedirectMiddleware } from '../../../packages/server/middleware/postRedirectGet/postRedirectMiddleware.ts';
import { RouterContext } from '../../../packages/server/middleware/types.ts';
import { SESSION_KEY } from '../../../packages/server/middleware/postRedirectGet/const.ts';

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
        const sessionWrite = mock.spy();
        const sessionSet = mock.spy();
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
            session: {
                set: sessionSet,
                write: sessionWrite,
            },
            route: {
                generator: {
                    generate: mock.spy(async () => generated),
                },
            },
        } as unknown as RouterContext, next);

        mock.assertSpyCalls(next, 0);
        mock.assertSpyCalls(sessionSet, 1);
        mock.assertSpyCall(sessionSet, 0, {
            args: [SESSION_KEY, ''],
        });
        mock.assertSpyCalls(sessionWrite, 1);
        mock.assertSpyCall(sessionWrite, 0, {
            args: [
                SESSION_KEY,
                JSON.stringify({
                    content: generated.content,
                    headers: Array.from(generated.headers.entries()),
                }),
            ],
        });
        asserts.assertEquals(response.status, http.Status.SeeOther);
        asserts.assertEquals(
            response.statusText,
            http.STATUS_TEXT[http.Status.SeeOther],
        );
        asserts.assertEquals(Array.from(response.headers.entries()), [
            ['location', 'http://example.com/'],
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
