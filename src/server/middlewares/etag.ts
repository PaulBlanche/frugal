import * as http from '../../../dep/std/http.ts';

import { Next } from '../types.ts';
import { Context } from '../Context.ts';

export async function etag<CONTEXT extends Context>(
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

    context.log(
        'response Etag headers match request If-None-Match header, send 304',
        { kind: 'debug', scope: 'etag' },
    );

    return new Response(null, {
        status: http.Status.NotModified,
        statusText: http.STATUS_TEXT[http.Status.NotModified],
        headers: headersNotModified(response.headers),
    });
}

function ifNoneMatch(request: Request, response: Response): boolean {
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

const HEADERS_NOT_MODIFIED = [
    'Content-Location',
    'Date',
    'Etag',
    'Vary',
    'Cache-Control',
    'Expires',
];

function headersNotModified(headersInit: HeadersInit): Headers {
    const headers = new Headers(headersInit);
    const headers304 = new Headers();

    for (const headerName of HEADERS_NOT_MODIFIED) {
        const headerValue = headers.get(headerName);
        if (headerValue !== null) {
            headers304.set(headerName, headerValue);
        }
    }

    return headers304;
}
