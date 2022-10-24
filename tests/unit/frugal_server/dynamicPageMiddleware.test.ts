import * as http from '../../../dep/std/http.ts';
import * as mock from '../../../dep/std/mock.ts';
import * as asserts from '../../../dep/std/asserts.ts';

import { dynamicPageMiddlewareMaker } from '../../../packages/frugal_server/middleware/dynamicPageMiddleware/mod.ts';
import { RouterContext } from '../../../packages/frugal_server/middleware/types.ts';
import { compute } from '../../../packages/frugal_server/etag.ts';

Deno.test('dynamicPageMiddleware: rejects static routes in non watch', async () => {
    const next = mock.spy(async () => new Response());
    const childrenMiddleware = mock.spy(async () => new Response());
    const dynamicPageMiddleware = dynamicPageMiddlewareMaker(
        childrenMiddleware,
    );

    await dynamicPageMiddleware({
        frugal: {
            config: {
                watch: false,
            },
        },
        route: {
            type: 'static',
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 1);
    mock.assertSpyCalls(childrenMiddleware, 0);
});

Deno.test('dynamicPageMiddleware: accept dynamic routes in non watch', async () => {
    const next = mock.spy(async () => new Response());
    const childrenMiddleware = mock.spy(async () => new Response());
    const dynamicPageMiddleware = dynamicPageMiddlewareMaker(
        childrenMiddleware,
    );

    await dynamicPageMiddleware({
        frugal: {
            config: {
                watch: false,
            },
        },
        route: {
            type: 'dynamic',
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 0);
    mock.assertSpyCalls(childrenMiddleware, 1);
});

Deno.test('dynamicPageMiddleware: accept static routes in watch', async () => {
    const next = mock.spy(async () => new Response());
    const childrenMiddleware = mock.spy(async () => new Response());
    const dynamicPageMiddleware = dynamicPageMiddlewareMaker(
        childrenMiddleware,
    );

    await dynamicPageMiddleware({
        frugal: {
            config: {
                watch: true,
            },
        },
        route: {
            type: 'static',
        },
    } as unknown as RouterContext, next);

    mock.assertSpyCalls(next, 0);
    mock.assertSpyCalls(childrenMiddleware, 1);
});
