import * as path from '../../../../dep/std/path.ts';

import * as log from '../../../log/mod.ts';
import * as frugal from '../../../core/mod.ts';

import { Next, RouterContext } from '../../types.ts';

import { sendFromCache } from './sendFromCache.ts';

function logger() {
    return log.getLogger(`frugal_server:cacheMiddleware`);
}

export async function cacheMiddleware(
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

    try {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            msg() {
                return `try to respond to ${this.method} ${this.pathname} from cache`;
            },
        });
        return await sendFromCache(context, url.pathname);
    } catch (error: unknown) {
        if (error instanceof frugal.NotFound) {
            logger().debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `No cached response found for ${this.method} ${this.pathname}. Yield to next middleware`;
                },
            });

            return await next(context);
        }
        throw error;
    }
}
