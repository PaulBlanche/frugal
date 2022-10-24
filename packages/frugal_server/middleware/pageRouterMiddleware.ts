import * as log from '../../log/mod.ts';

import { Next } from '../types.ts';
import { composeMiddleware } from '../composeMiddleware.ts';
import { Context, RouterContext } from './types.ts';
import { dynamicPageMiddleware } from './dynamicPageMiddleware/mod.ts';
import { staticPageMiddleware } from './staticPageMiddleware/mod.ts';
import { etagMiddleware } from './etagMiddleware.ts';

function logger() {
    return log.getLogger(`frugal_server:pageRouterMiddleware`);
}

export function pageRouterMiddleware(
    context: Context,
    next: Next<Context>,
) {
    const url = new URL(context.request.url);
    const route = context.frugal.getMatchingRoute(url.pathname);

    if (route === undefined) {
        logger().debug({
            pathname: url.pathname,
            msg() {
                return `no route found for ${this.pathname}. Yield`;
            },
        });

        return next(context);
    }

    // route can't handle the request method, yield
    if (
        context.request.method !== 'GET' &&
        !(context.request.method in route.page.handlers)
    ) {
        logger().debug({
            method: context.request.method,
            handlers: Object.keys(route.page.handlers),
            msg() {
                return `route can\'t handle ${this.method}, only handle ${this.handlers}. Yield.`;
            },
        });

        return next(context);
    }

    return composedMiddleware(
        { ...context, route },
        next,
    );
}

const composedMiddleware = composeMiddleware<RouterContext>(
    etagMiddleware,
    dynamicPageMiddleware,
    staticPageMiddleware,
);
