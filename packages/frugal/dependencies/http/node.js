import * as _type from "../_type/http.js";
export * from "../_type/http.js";

import * as http from "node:http";
import * as https from "node:https";
import * as stream from "node:stream";
import * as webStream from "node:stream/web";
import * as path from "../path/node.js";
import * as xxhash from "../xxhash/node.js";
import * as fs from "../fs/node.js";
import * as mime from "mime-types";
import { serialize, parse } from "cookie";

const BODYLESS_METHODS = ["HEAD", "GET"];

/**
 * @param {Headers} headers
 * @param {_type.Cookie} cookie
 */
export function setCookie(headers, cookie) {
    const value = toString(cookie);
    if (value === "") {
        headers.append("Set-Cookie", value);
    }
}

/**
 * @param {Headers} headers
 * @returns {Record<string, string>}
 */
export function getCookies(headers) {
    const cookie = headers.get("Cookie");
    if (cookie !== null) {
        return parse(cookie);
    }
    return {};
}

/**
 * @param {_type.Cookie} cookie
 * @returns {string}
 */
function toString(cookie) {
    return serialize(cookie.name, cookie.value, {
        ...cookie,
        expires: cookie.expires === undefined ? undefined : new Date(cookie.expires),
    });
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
    const protocol = secureOptions.cert !== undefined ? "https:" : "http:";
    const origin = `${protocol}//${hostname}`;

    const server = secureOptions.cert
        ? https.createServer(
              {
                  cert: secureOptions.cert,
                  key: secureOptions.key,
              },
              nodeServerHandler,
          )
        : http.createServer(nodeServerHandler);

    server.listen(port, hostname, () => {
        onListen?.({ hostname, port });
    });

    return new Promise((res, rej) => {
        signal?.addEventListener("abort", () => server.close(() => res()));
    });

    /**
     * @param {http.IncomingMessage} req
     * @param {http.ServerResponse<http.IncomingMessage>} res
     */
    async function nodeServerHandler(req, res) {
        const request = toRequest(origin, req);

        const response = await handler(request, {
            hostname,
            port,
            identifier: await identifier(request, req),
        });

        // for event-stream Response we need to close the body stream when the
        // client disconnects. The client disconnect triggers a `close` event on
        // the request. Here we need to close the underlying stream but it is
        // locked. The `close` method added for event-stream Response bypass the
        // lock by closing directly on the underlying controller of the stream
        if (isEventStreamResponse(response)) {
            req.on("close", () => {
                response.close();
            });
        }

        answerWithResponse(response, res);
    }
}

/**
 * @param {Response} response
 * @param {http.ServerResponse<http.IncomingMessage>} res
 */
async function answerWithResponse(response, res) {
    const header = Object.fromEntries(response.headers.entries());

    res.writeHead(response.status, response.statusText, header);

    if (response.body !== null) {
        // cast to node `ReadableStream` because the global ReadableStream is not async interable in
        // ts types (https://github.com/microsoft/TypeScript/issues/29867).
        const asyncIterableStream = /** @type {webStream.ReadableStream} */ (response.body);

        for await (const chunk of asyncIterableStream) {
            res.write(chunk);
        }
    }

    // close after writing the body only if it is not an SSE Response
    if (!isEventStreamResponse(response)) {
        res.end();
    }

    return;
}

/**
 * @param {string} origin
 * @param {http.IncomingMessage} req
 */
function toRequest(origin, req) {
    // `IncomingMessage` is typed with `url: string|undefined` because it could come from a Server (with an url) or a ClientRequest (without an url).
    // We are 100% in the server case, so `url` is guaranteed to be `string`.
    const url = new URL(/** @type {string} */ (req.url), origin);

    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
            for (const entry of value) {
                headers.append(name, entry);
            }
        } else if (value !== undefined) {
            headers.set(name, value);
        }
    }

    const method = req.method ?? "GET";

    const body = BODYLESS_METHODS.includes(method)
        ? undefined
        : /** @type {ReadableStream} */ (stream.Readable.toWeb(req));

    return new Request(url, {
        headers,
        method,
        body,
        // @ts-expect-error: duplex does not exists on node types, but
        // needed to send a body. See :
        // https://developer.chrome.com/articles/fetch-streaming-requests/#half-duplex
        duplex: body && "half",
    });
}

/**
 * @param {Request} request
 * @param {http.IncomingMessage} req
 * @returns {Promise<string>}
 */
async function identifier(request, req) {
    const requestUrl = new URL(request.url);
    const normalizedInternalUrl =
        path.normalize(decodeURIComponent(requestUrl.pathname)) + requestUrl.search;

    const remoteHostname = getRemoteAddress(request, req) ?? "???";
    const method = request.method;

    const hash = (await xxhash.create())
        .update(normalizedInternalUrl)
        .update(remoteHostname)
        .update(method)
        .update(String(Date.now()))
        .digest();

    return hash;
}

/**
 * @param {Request} request
 * @param {http.IncomingMessage} req
 */
function getRemoteAddress(request, req) {
    const xForwardedFor = request.headers.get("X-Forwarded-For");
    if (!xForwardedFor) {
        return req.socket.remoteAddress;
    }
    const values = xForwardedFor.split(/\s*,\s*/);
    return values[0];
}

/**
 * @param {Response | _type.EventStreamResponse} response
 * @returns {response is _type.EventStreamResponse}
 */
function isEventStreamResponse(response) {
    return "close" in response;
}

/**
 * @param {Request} request
 * @param {_type.SendOptions} options
 * @returns {Promise<Response>}
 */
export async function send(request, options) {
    const url = new URL(request.url);
    const decodedPathname = decodeURIComponent(url.pathname);
    const normalizedPath = path.normalize(decodedPathname);

    if (normalizedPath !== decodedPathname) {
        url.pathname = normalizedPath;
        return Response.redirect(url, 301);
    }

    const filePath = `.${decodedPathname}`;

    if (!isValidPath(filePath)) {
        return new Response("", {
            status: 404,
        });
    }

    const resolvedFilePath = path.resolve(options.rootDir, filePath);

    try {
        const stats = await fs.stat(resolvedFilePath);

        const headers = new Headers();
        headers.set("Content-Length", stats.size.toString());
        if (stats.mtime) {
            headers.set("Last-Modified", stats.mtime.toUTCString());
        }
        headers.set("Etag", await computeWeak(stats));
        const contentType = mime.contentType(path.extname(resolvedFilePath));
        if (contentType) {
            headers.set("Content-Type", contentType);
        }

        const body = await fs.createReadableStream(resolvedFilePath);

        return new Response(body, { headers });
    } catch (/** @type {any} */ error) {
        if (error instanceof fs.errors.NotFound) {
            return new Response(undefined, { status: 404 });
        }
        return new Response(error.message, { status: 500 });
    }
}

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isValidPath(filePath) {
    if (typeof filePath !== "string") {
        return false;
    }

    // malicious NULL in path
    if (filePath.indexOf("\0") !== -1) {
        return false;
    }

    // malicious absolute path
    if (path.isAbsolute(filePath)) {
        return false;
    }

    // malicious UP (..) in path
    if (UP_PATH_REGEXP.test(path.normalize("." + path.SEP + filePath))) {
        return false;
    }

    return true;
}

/**
 * @param {fs.FileInfo} stats
 * @returns {Promise<string>}
 */
async function computeWeak(stats) {
    return `W/${(await xxhash.create()).update(stats.mtime?.toJSON() ?? "empty").digest()}`;
}
