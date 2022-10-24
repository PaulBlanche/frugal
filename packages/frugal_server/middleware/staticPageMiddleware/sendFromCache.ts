import * as http from '../../../../dep/std/http.ts';
import * as path from '../../../../dep/std/path.ts';

import * as frugal from '../../../core/mod.ts';

import * as etag from '../../etag.ts';
import { RouterContext } from '../types.ts';

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
    const [content, headers] = await Promise.all([
        context.frugal.config.pagePersistance.read(pagePath),
        getHeaders(context, pagePath),
    ]);
    headers.set('Etag', etag.compute(content));

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
