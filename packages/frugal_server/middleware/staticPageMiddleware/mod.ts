import * as log from '../../../log/mod.ts';
import * as frugal from '../../../core/mod.ts';

import { Next, RouterContext } from '../../types.ts';
import * as postRedirectGet from '../postRedirectGet/mod.ts';
import { composeMiddleware } from '../../composeMiddleware.ts';
import { forceRefreshMiddleware } from './forceRefreshMiddleware.ts';
import { cacheMiddleware } from './cacheMiddleware.ts';
import { refreshJitMiddleware } from './refreshJitMiddleware.ts';

function logger() {
    return log.getLogger(`frugal_server:staticPageMiddleware`);
}

export function staticPageMiddleware(
    context: RouterContext,
    next: Next<RouterContext>,
) {
    const route = context.route;

    if (route.type !== 'static') {
        logger().debug({
            msg: 'can\'t statically serve dynamic route. Yield to next middleware',
        });

        return next(context);
    }

    return composedMiddleware({ ...context, route }, next);
}

const composedMiddleware = composeMiddleware<RouterContext<frugal.StaticRoute>>(
    forceRefreshMiddleware,
    postRedirectGet.getMiddleware,
    postRedirectGet.postRedirectMiddleware,
    cacheMiddleware,
    refreshJitMiddleware,
);
