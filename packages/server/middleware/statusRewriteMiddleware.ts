import * as http from '../../../dep/std/http.ts';
import * as log from '../../log/mod.ts';

import { Middleware, Next } from '../types.ts';
import { Context } from './types.ts';

function logger() {
    return log.getLogger(`frugal_server:statusRewriteMiddleware`);
}

async function safeNext(context: Context, next: Next<Context>) {
    try {
        return await next(context);
        // deno-lint-ignore no-explicit-any
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

export function statusRewriteMiddleware(middleware: Middleware<Context>) {
    return async (
        context: Context,
        next: Next<Context>,
    ) => {
        const response = await safeNext(context, next);

        const url = new URL(context.request.url);
        const route = context.frugal.getMatchingRoute(url.pathname);

        const mapping =
            context.config.statusMapping[response.status as http.Status];
        if (mapping !== undefined && route !== undefined) {
            const mapped = mapping(new URL(url));
            const dest = new URL(mapped.url, url);

            if (mapped.type === 'redirect') {
                logger().debug({
                    status: response.status,
                    src: url.href,
                    dest: dest.href,
                    msg() {
                        return `Response to ${this.src} with status ${this.status}, redirected to ${this.dest}`;
                    },
                });

                const headers = new Headers(response.headers);
                headers.set('Location', dest.href);

                return new Response(null, {
                    status: mapped.status,
                    statusText: http.STATUS_TEXT[mapped.status],
                    headers,
                });
            }

            logger().debug({
                status: response.status,
                src: url.href,
                dest: dest.href,
                msg() {
                    return `Response to ${this.src} with status ${this.status}, try a rewrite to ${this.dest}`;
                },
            });

            // simulate request to rewritten path
            const request = new Request(dest, context.request);
            // is response had any set cookie, set them as cookie on the
            // simulated request as if the browser made the request after a
            // redirection
            const cookies = response.headers.get('Set-Cookie');
            if (cookies) {
                request.headers.set('Cookie', cookies);
            }

            const rewriteResponse = await middleware(
                { ...context, request },
                next,
            );

            logger().info({
                status: response.status,
                src: url.href,
                dest: dest.href,
                msg() {
                    return `Response to ${this.src} with status ${this.status} successfully rewritten to ${this.dest}`;
                },
            });

            return new Response(rewriteResponse.body, {
                status: response.status,
                statusText: response.statusText,
                headers: rewriteResponse.headers,
            });
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
