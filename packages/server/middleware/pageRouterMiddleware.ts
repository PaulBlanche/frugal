import * as log from '../../log/mod.ts';

import { Next } from '../types.ts';
import { composeMiddleware } from '../composeMiddleware.ts';
import { Context, RouterContext } from './types.ts';
import { dynamicPageMiddleware } from './dynamicPageMiddleware/mod.ts';
import { staticPageMiddleware } from './staticPageMiddleware/mod.ts';
import { etagMiddleware } from './etagMiddleware.ts';
import { csrfMiddleware } from './csrfMiddleware/mod.ts';

function logger() {
    return log.getLogger('frugal_server:pageRouterMiddleware');
}

export function pageRouterMiddleware(context: Context, next: Next<Context>) {
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
    if (!(context.request.method in route.page)) {
        logger().debug({
            method: context.request.method,
            pattern: route.page.pattern,
            msg() {
                return `Page ${this.pattern} can\'t handle ${this.method}. Yield.`;
            },
        });

        return next(context);
    }

    context.session.send();

    return composedMiddleware(
        { ...context, route },
        next,
    );
}

const composedMiddleware = composeMiddleware<RouterContext>(
    csrfMiddleware,
    etagMiddleware,
    staticPageMiddleware,
    dynamicPageMiddleware,
);
