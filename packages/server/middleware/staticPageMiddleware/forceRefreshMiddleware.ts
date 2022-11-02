import * as http from '../../../../dep/std/http.ts';

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

    const key = url.searchParams.get('force_refresh');
    if (!key) {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            msg() {
                return `no refresh key in request for ${this.method} ${this.pathname}. Yield to next middleware`;
            },
        });

        return next(context);
    }

    if (key !== context.config.refreshKey) {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            requestKey: key,
            configKey: context.config.refreshKey,
            msg() {
                return `refresh key in request ${this.requestKey} not matching refresh key in config ${this.configKey}. Yield to next middleware`;
            },
        });

        return next(context);
    }

    await context.route.refresher.refresh(url.pathname);

    const redirectionUrl = new URL(url);
    redirectionUrl.searchParams.delete('force_refresh');

    return new Response(null, {
        status: http.Status.SeeOther,
        headers: {
            Location: redirectionUrl.href,
        },
    });

    logger().debug({
        method: context.request.method,
        pathname: url.pathname,
        msg() {
            return `refresh for ${this.method} ${this.pathname} done. Yield to next middleware`;
        },
    });

    return await next(context);
}
