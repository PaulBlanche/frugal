import * as http from '../../../../dep/std/http.ts';
import * as frugal from '../../../core/mod.ts';
import * as log from '../../../log/mod.ts';

import { Next } from '../../types.ts';
import { RouterContext } from '../types.ts';

import { SESSION_KEY } from './const.ts';

function logger() {
    return log.getLogger(`frugal_server:postRedirectGet:getMiddleware`);
}

export async function getMiddleware<ROUTE extends frugal.Route>(
    context: RouterContext<ROUTE>,
    next: Next<RouterContext<ROUTE>>,
) {
    const url = new URL(context.request.url);

    if (context.request.method !== 'GET') {
        logger().debug({
            method: context.request.method,
            msg() {
                return `${this.method} is not a GET. Yield to next middleware`;
            },
        });

        return next(context);
    }

    if (!context.session.has('PRG')) {
        logger().debug({
            msg: 'no PRG info in session. Yield to next middleware',
        });

        return next(context);
    }

    try {
        logger().debug({
            method: context.request.method,
            pathname: url.pathname,
            msg() {
                return `try to answer ${this.method} ${this.pathname} with page saved in session`;
            },
        });

        const sessionData = await context.session.read(SESSION_KEY);
        const result = JSON.parse(sessionData);

        const headers = new Headers(result.headers);

        if (!headers.has('content-type')) {
            headers.set('content-type', 'text/html; charset=utf-8');
        }
        if (!headers.has('cache-control')) {
            headers.set('cache-control', 'no-store');
        }

        await context.session.delete(SESSION_KEY);
        context.session.unset(SESSION_KEY);

        return new Response(result.content, {
            status: http.Status.OK,
            statusText: http.STATUS_TEXT[http.Status.OK],
            headers,
        });
    } catch (error: unknown) {
        if (error instanceof frugal.NotFound) {
            logger().debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `No page stored in session for ${this.method} ${this.pathname}. Yield to next middleware`;
                },
            });

            const response = await next(context);

            context.session.unset(SESSION_KEY);

            return response;
        }

        throw error;
    }
}
