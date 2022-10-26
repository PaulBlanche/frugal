import * as http from '../../dep/std/http.ts';
import * as log from '../log/mod.ts';

import { Middleware, Next } from './types.ts';
import { FrugalContext } from './middleware/types.ts';

function logger() {
    return log.getLogger(`frugal_server:statusRewriteMiddleware`);
}

async function safeNext(context: FrugalContext, next: Next<FrugalContext>) {
    try {
        return await next(context);
    } catch (error: any) {
        logger().error({
            msg: `Error in some middleware transformed in a 500 status response`,
        }, error);

        return new Response(null, {
            status: http.Status.InternalServerError,
            statusText: http.STATUS_TEXT[http.Status.InternalServerError],
        });
    }
}

export function statusRewriteMiddleware(middleware: Middleware<FrugalContext>) {
    return async (
        context: FrugalContext,
        next: Next<FrugalContext>,
    ) => {
        const response = await safeNext(context, next);

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

            const rewriteResponse = await middleware(
                { ...context, request },
                next,
            );

            logger().info({
                status: response.status,
                pathname: url.pathname,
                path,
                msg() {
                    return `Response to ${this.pathname} with status ${this.status} successfully rewritten to ${this.path}`;
                },
            });

            return rewriteResponse;
        }

        logger().debug({
            status: response.status,
            msg() {
                return `No rewrites found.`;
            },
        });

        return response;
    };
}
