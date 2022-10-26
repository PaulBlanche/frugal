import * as log from '../log/mod.ts';

import { Middleware, Next } from './types.ts';
import { FrugalContext } from './middleware/types.ts';

function logger() {
    return log.getLogger(`frugal_server:statusRewriteMiddleware`);
}

export function statusRewriteMiddleware(middleware: Middleware<FrugalContext>) {
    return async (
        context: FrugalContext,
        next: Next<FrugalContext>,
    ) => {
        const response = await next(context);

        const pathname = context.config.statusRewrite[response.status];
        if (pathname !== undefined) {
            const url = new URL(context.request.url);
            const path = pathname(new URL(url));

            logger().debug({
                status: response.status,
                pathname: url.pathname,
                path,
                msg() {
                    return `Response to ${this.pathname} with status ${this.status}, try a rewrite to ${this.path}`;
                },
            });

            const request = new Request(
                new URL(path, url),
                context.request,
            );
            const newResponse = await middleware({ ...context, request }, next);

            logger().info({
                status: response.status,
                pathname: url.pathname,
                path,
                msg() {
                    return `Response to ${this.pathname} with status ${this.status} successfully rewritten to ${this.path}`;
                },
            });

            return new Response(newResponse.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newResponse.headers,
            });
        }

        logger().debug({
            status: response.status,
            msg() {
                return `No rewrites found. Yield`;
            },
        });

        return next(context);
    };
}
