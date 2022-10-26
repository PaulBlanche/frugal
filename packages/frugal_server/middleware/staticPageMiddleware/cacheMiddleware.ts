import * as http from '../../../../dep/std/http.ts';
import * as path from '../../../../dep/std/path.ts';

import * as log from '../../../log/mod.ts';
import * as frugal from '../../../core/mod.ts';

import * as etag from '../../etag.ts';
import { Next } from '../../types.ts';

import { RouterContext } from '../types.ts';

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

export async function sendFromCache(
    context: RouterContext<frugal.StaticRoute>,
    pathname: string,
) {
    if (pathname.endsWith('.html')) {
        return sendFileFromCache(context, pathname);
    } else {
        return await sendFileFromCache(
            context,
            path.join(pathname, 'index.html'),
        );
    }
}

export async function sendFileFromCache(
    context: RouterContext<frugal.StaticRoute>,
    pathname: string,
) {
    const pagePath = path.join(context.frugal.config.publicDir, pathname);

    const [headers, status] = await Promise.all([
        getHeaders(context, pagePath),
        getStatus(context, pagePath),
    ]);

    if (status !== undefined) {
        return new Response(null, {
            status,
            statusText: http.STATUS_TEXT[status],
            headers,
        });
    }

    const content = await context.frugal.config.pagePersistance.read(pagePath);

    const Etag = headers.get('etag');
    if (Etag === null) {
        headers.set('Etag', etag.compute(content));
    }

    const contentType = headers.get('content-type');
    if (contentType === null) {
        headers.set('content-type', 'text/html; charset=utf-8');
    }

    return new Response(content, {
        status: http.Status.OK,
        statusText: http.STATUS_TEXT[http.Status.OK],
        headers,
    });
}

async function getHeaders(
    context: RouterContext<frugal.StaticRoute>,
    pagePath: string,
) {
    try {
        const headers = await context.frugal.config.pagePersistance.read(
            frugal.headersPath(pagePath),
        );
        return new Headers(JSON.parse(headers));
    } catch {
        return new Headers();
    }
}

async function getStatus(
    context: RouterContext<frugal.StaticRoute>,
    pagePath: string,
): Promise<http.Status | undefined> {
    try {
        const stringStatus = await context.frugal.config.pagePersistance.read(
            frugal.statusPath(pagePath),
        );

        const status = Number(stringStatus);
        if (Number.isNaN(status)) {
            return undefined;
        }

        return status;
    } catch {
        return undefined;
    }
}
