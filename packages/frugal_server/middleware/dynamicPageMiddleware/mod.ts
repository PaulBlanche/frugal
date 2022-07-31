import * as log from '../../../log/mod.ts';

import { Next, RouterContext } from '../../types.ts';
import * as postRedirectGet from '../postRedirectGet/mod.ts';
import { composeMiddleware } from '../../composeMiddleware.ts';
import { generateMiddleware } from './generateMiddleware.ts';

function logger() {
    return log.getLogger(`frugal_server:dynamicPageMiddleware`);
}

export function dynamicPageMiddleware(
    context: RouterContext,
    next: Next<RouterContext>,
) {
    // route is not dynamic (or static in watch mode), yield
    if (
        context.route.type === 'static' &&
        !context.frugal.config.watch
    ) {
        logger().debug({
            msg: 'can\'t dynamically handle static route in non-watch mode. Yield',
        });

        return next(context);
    }

    return composedMiddleware(context, next);
}

const composedMiddleware = composeMiddleware<RouterContext>(
    postRedirectGet.getMiddleware,
    postRedirectGet.postRedirectMiddleware,
    generateMiddleware,
);
