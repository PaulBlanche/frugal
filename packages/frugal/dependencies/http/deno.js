import * as _type from "../_type/http.js";
export * from "../_type/http.js";

import * as file_server from "../_dep/std/http/file_server.js";
import * as http from "../_dep/std/http.js";

/**
 * @param {Headers} headers
 * @param {_type.Cookie} cookie
 */
export function setCookie(headers, cookie) {
    http.setCookie(headers, cookie);
}

/**
 * @param {Headers} headers
 * @returns {Record<string, string>}
 */
export function getCookies(headers) {
    return http.getCookies(headers);
}

/**
 * @param {_type.Handler} handler
 * @param {_type.ServeOptions} [options]
 * @returns {Promise<void>}
 */
export function serve(
    handler,
    { port = 8000, hostname = "0.0.0.0", onListen, signal, ...secureOptions } = {},
) {
    const server = Deno.serve(
        {
            port,
            hostname,
            onListen,
            signal,
            cert: secureOptions.cert,
            key: secureOptions.key,
        },
        handler,
    );

    return server.finished;
}

/**
 * @param {Request} request
 * @param {_type.SendOptions} options
 * @returns {Promise<Response>}
 */
export async function send(request, options) {
    return file_server.serveDir(request, {
        fsRoot: options.rootDir,
    });
}
