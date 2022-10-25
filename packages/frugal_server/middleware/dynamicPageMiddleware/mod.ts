import * as log from '../../../log/mod.ts';

import { Middleware, Next } from '../../types.ts';
import * as postRedirectGet from '../postRedirectGet/mod.ts';
import { composeMiddleware } from '../../composeMiddleware.ts';
import { generateMiddleware } from './generateMiddleware.ts';
import { RouterContext } from '../types.ts';

function logger() {
    return log.getLogger(`frugal_server:dynamicPageMiddleware`);
}

export function _dynamicPageMiddlewareMaker(
    childrenMiddleware: Middleware<RouterContext>,
) {
    return (
        context: RouterContext,
        next: Next<RouterContext>,
    ) => {
        // route is not dynamic (or static in watch mode), yield
        if (
            context.request.method === 'GET' &&
            context.route.type === 'static' &&
            !context.frugal.config.watch
        ) {
            logger().debug({
                msg: 'can\'t dynamically handle static route in non-watch mode. Yield',
            });

            return next(context);
        }

        return childrenMiddleware(context, next);
    };
}

export const dynamicPageMiddleware = _dynamicPageMiddlewareMaker(
    composeMiddleware<RouterContext>(
        postRedirectGet.getMiddleware,
        postRedirectGet.postRedirectMiddleware,
        generateMiddleware,
    ),
);
