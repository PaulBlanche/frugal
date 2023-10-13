import * as middleware from "../Middleware.js";
import * as context from "../Context.js";

/**
 * @template {context.Context} CONTEXT
 * @param {CONTEXT} context
 * @param {middleware.Next<CONTEXT>} next
 * @returns
 */
export async function etag(context, next) {
    const response = await next(context);

    if (response.status !== 200) {
        return response;
    }

    if (ifNoneMatch(context.request, response)) {
        return response;
    }

    context.log("response Etag headers match request If-None-Match header, send 304", {
        level: "debug",
        scope: "etag",
    });

    return new Response(null, {
        status: 304,
        headers: headersNotModified(response.headers),
    });
}

/**
 * @param {Request} request
 * @param {Response} response
 * @returns {boolean}
 */
function ifNoneMatch(request, response) {
    const ifNoneMatch = request.headers.get("If-None-Match");
    if (ifNoneMatch === null) {
        return true;
    }

    if (ifNoneMatch.trim() === "*") {
        return false;
    }

    const etag = response.headers.get("Etag");
    const tags = ifNoneMatch.split(/\s*,\s*/);
    return etag === null || !tags.includes(etag);
}

const HEADERS_NOT_MODIFIED = [
    "Content-Location",
    "Date",
    "Etag",
    "Vary",
    "Cache-Control",
    "Expires",
];

/**
 * @param {HeadersInit} headersInit
 * @returns {Headers}
 */
function headersNotModified(headersInit) {
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
