import * as log from '../../../log/mod.ts';
import * as frugal from '../../../core/mod.ts';

import { Next } from '../../types.ts';
import { RouterContext } from '../types.ts';

function logger() {
    return log.getLogger(`frugal_server:forceRefreshMiddleware`);
}

export async function forceRefreshMiddleware(
    context: RouterContext<frugal.StaticRoute>,
    next: Next<RouterContext<frugal.StaticRoute>>,
) {
    if (context.config.refreshKey === undefined) {
        logger().debug({
            msg() {
                return `no refresh key in config. Yield to next middleware`;
            },
        });

        return next(context);
    }

    const url = new URL(context.request.url);

    logger().debug({
        method: context.request.method,
        pathname: url.pathname,
        msg() {
            return `handleing ${this.method} ${this.pathname}`;
        },
    });

    if (!url.searchParams.has('force_refresh')) {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            msg() {
                return `no refresh key in request for ${this.method} ${this.pathname}. Yield to next middleware`;
            },
        });

        return next(context);
    }

    const authorization = context.request.headers.get('Authorization');
    const match = authorization?.match(/Bearer (.*)/);
    if (
        match === null || match === undefined ||
        match[1] !== context.config.refreshKey
    ) {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            requestKey: match?.[1],
            configKey: context.config.refreshKey,
            msg() {
                return `refresh key in request ${this.requestKey} not matching refresh key in config ${this.configKey}. Yield to next middleware`;
            },
        });

        return next(context);
    }

    await context.route.refresher.refresh(url.pathname);

    logger().debug({
        method: context.request.method,
        pathname: url.pathname,
        msg() {
            return `refresh for ${this.method} ${this.pathname} done. Yield to next middleware`;
        },
    });

    return await next(context);
}
