import * as log from '../../../log/mod.ts';
import * as frugal from '../../../core/mod.ts';

import { Next } from '../../types.ts';
import { RouterContext } from '../types.ts';

function logger() {
    return log.getLogger(`frugal_server:refreshJitMiddleware`);
}

export async function refreshJitMiddleware(
    context: RouterContext<frugal.StaticRoute>,
    next: Next<RouterContext<frugal.StaticRoute>>,
) {
    const url = new URL(context.request.url);

    logger().debug({
        method: context.request.method,
        pathname: url.pathname,
        msg() {
            return `handle ${this.method} ${this.pathname}`;
        },
    });

    await context.route.refresher.refresh(url.pathname);

    return next(context);
}
