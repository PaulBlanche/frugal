import * as http from '../../../../dep/std/http.ts';
import * as frugal from '../../../core/mod.ts';
import * as log from '../../../log/mod.ts';

import { Next } from '../../types.ts';
import { RouterContext } from '../types.ts';

import { SESSION_COOKIE_NAME } from './const.ts';

function logger() {
    return log.getLogger(
        `frugal_server:postRedirectGet:postRedirectMiddleware`,
    );
}

const METHODS = [
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
];

export async function postRedirectMiddleware<ROUTE extends frugal.Route>(
    context: RouterContext<ROUTE>,
    next: Next<RouterContext<ROUTE>>,
) {
    const url = new URL(context.request.url);

    if (!METHODS.includes(context.request.method)) {
        logger().debug({
            method: context.request.method,
            handlers: METHODS,
            msg() {
                return `middleware can't handle ${this.method}, only handle ${this.handlers}. Yield to next middleware`;
            },
        });
        return next(context);
    }

    logger().debug({
        method: context.request.method,
        pathname: url.pathname,
        msg() {
            return `handling ${this.method} ${this.pathname}`;
        },
    });

    const result = await context.route.generator.generate(
        context.request,
    );

    const sessionId = await context.sessionManager.set(JSON.stringify({
        content: result.content,
        headers: Object.fromEntries(result.headers.entries()),
    }));

    logger().debug({
        method: context.request.method,
        pathname: url.pathname,
        session: sessionId,
        msg() {
            return `serve ${this.method} ${this.pathname} with a PRG redirection with session ${this.session}`;
        },
    });

    const headers = new Headers({
        'Location': url.href,
    });

    http.setCookie(headers, {
        name: SESSION_COOKIE_NAME,
        value: sessionId,
    });

    return new Response(null, {
        status: http.Status.SeeOther,
        statusText: http.STATUS_TEXT[http.Status.SeeOther],
        headers,
    });
}
