import * as http from '../../../../dep/std/http.ts';
import * as log from '../../../log/mod.ts';

import * as etag from '../../etag.ts';
import { RouterContext } from '../types.ts';

function logger() {
    return log.getLogger(`frugal_server:generateMiddleware`);
}

export async function generateMiddleware(
    context: RouterContext,
): Promise<Response> {
    const url = new URL(context.request.url);

    logger().debug({
        method: context.request.method,
        pathname: url.pathname,
        msg() {
            return `handling ${this.method} ${this.pathname}`;
        },
    });

    const result = await context.route.generator.generate(
        context.request,
        context.state,
    );

    logger().info({
        method: context.request.method,
        pathname: url.pathname,
        msg() {
            return `handle successful for ${this.method} ${this.pathname}`;
        },
    });

    if (result instanceof Response) {
        return result;
    }

    const headers = new Headers(result.headers);

    if ('status' in result) {
        return new Response(null, {
            status: result.status,
            statusText: http.STATUS_TEXT[result.status],
            headers: result.headers,
        });
    }

    const contentType = headers.get('content-type');
    if (contentType === null) {
        headers.set('content-type', 'text/html; charset=utf-8');
    }

    const Etag = headers.get('etag');
    if (Etag === null) {
        headers.set('Etag', etag.compute(result.content));
    }

    const response = new Response(result.content, {
        status: http.Status.OK,
        statusText: http.STATUS_TEXT[http.Status.OK],
        headers,
    });

    return response;
}
