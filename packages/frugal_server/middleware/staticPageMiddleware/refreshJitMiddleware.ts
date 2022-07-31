import * as log from '../../../log/mod.ts';
import * as frugal from '../../../core/mod.ts';

import { Next, RouterContext } from '../../types.ts';
import { sendFromCache } from './sendFromCache.ts';

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

    return sendFromCache(context, url.pathname);
}
