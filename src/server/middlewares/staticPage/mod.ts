import { Next } from '../../types.ts';
import * as prg from '../prg/mod.ts';
import { composeMiddleware } from '../../composeMiddleware.ts';
import { forceRefresh } from './forceRefresh.ts';
import { cache } from './cache.ts';
import { refreshJit } from './refreshJit.ts';
import { RouteContext } from '../RouteContext.ts';
import { StaticRoute } from '../../../page/Router.ts';
import { generate } from '../dynamicPage/generate.ts';

export function staticPage(context: RouteContext, next: Next<RouteContext>) {
    const route = context.route;

    if (route.type !== 'static') {
        context.log(
            'can\'t statically serve dynamic route. Yield to next middleware',
        );

        return next(context);
    }

    return composedMiddleware({ ...context, route }, next);
}

const composedMiddleware = composeMiddleware<RouteContext<StaticRoute>>(
    forceRefresh,
    prg.get,
    prg.postRedirect,
    devMode,
    cache,
    refreshJit,
    cache,
);

function devMode(
    context: RouteContext<StaticRoute>,
    next: Next<RouteContext<StaticRoute>>,
) {
    if (!context.config.isDevMode) {
        return next(context);
    }

    context.log(`dynamically generating static page for dev mode`, {
        kind: 'debug',
        scope: 'devMode',
    });

    return generate(context);
}
