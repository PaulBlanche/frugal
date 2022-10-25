import * as mock from '../../../dep/std/mock.ts';

import { _dynamicPageMiddlewareMaker } from '../../../packages/frugal_server/middleware/dynamicPageMiddleware/mod.ts';
import { RouterContext } from '../../../packages/frugal_server/middleware/types.ts';

Deno.test('dynamicPageMiddleware: rejects static routes in non watch', async () => {
    const next = mock.spy(async () => new Response());
    const childrenMiddleware = mock.spy(async () => new Response());
    const dynamicPageMiddleware = _dynamicPageMiddlewareMaker(
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
    const dynamicPageMiddleware = _dynamicPageMiddlewareMaker(
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
    const dynamicPageMiddleware = _dynamicPageMiddlewareMaker(
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
