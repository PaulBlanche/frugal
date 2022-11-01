import * as http from '../../../dep/std/http.ts';

import * as log from '../../log/mod.ts';

import { Next } from '../types.ts';

import { FrugalContext } from './types.ts';

const HEADERS_304 = [
    'Content-Location',
    'Date',
    'Etag',
    'Vary',
    'Cache-Control',
    'Expires',
];

function logger() {
    return log.getLogger(`frugal_server:etagMiddleware`);
}

export async function etagMiddleware<CONTEXT extends FrugalContext>(
    context: CONTEXT,
    next: Next<CONTEXT>,
) {
    const response = await next(context);

    if (response.status !== 200) {
        return response;
    }

    if (ifNoneMatch(context.request, response)) {
        return response;
    }

    logger().debug({
        msg: 'response Etag headers match request If-None-Match header, send 304',
    });

    return new Response(null, {
        status: http.Status.NotModified,
        statusText: http.STATUS_TEXT[http.Status.NotModified],
        headers: headersNotModified(response.headers),
    });
}

export function ifNoneMatch(request: Request, response: Response): boolean {
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === null) {
        return true;
    }

    if (ifNoneMatch.trim() === '*') {
        return false;
    }

    const etag = response.headers.get('Etag');
    const tags = ifNoneMatch.split(/\s*,\s*/);
    return etag === null || !tags.includes(etag);
}

export function headersNotModified(headersInit: HeadersInit): Headers {
    const headers = new Headers(headersInit);
    const headers304 = new Headers();

    for (const headerName of HEADERS_304) {
        const headerValue = headers.get(headerName);
        if (headerValue !== null) {
            headers304.set(headerName, headerValue);
        }
    }

    return headers304;
}
