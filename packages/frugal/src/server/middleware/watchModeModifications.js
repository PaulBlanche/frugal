import * as fs from "../../../dependencies/fs.js";
import * as path from "../../../dependencies/path.js";

import * as context from "../Context.js";
import * as middleware from "../Middleware.js";

/**
 * @param {context.Context} context
 * @param {middleware.Next<context.Context>} next
 * @returns
 */
export async function watchModeModifications(context, next) {
    if (!context.watchMode) {
        return next(context);
    }

    const response = await next(context);
    const headers = new Headers(response.headers);

    // disable cache for every response in watchMode
    headers.set("Cache-Control", "no-store");

    // bail on empty or non html response
    if (!response.body || !headers.get("Content-Type")?.startsWith("text/html")) {
        return new Response(response.body, {
            headers,
            status: response.status,
            statusText: response.statusText,
        });
    }

    // inject livereload script at the end of the document for non empty html
    // response
    return new Response(await injectLivereloadScript(response.body, context), {
        headers,
        status: response.status,
        statusText: response.statusText,
    });
}

const DECODER = new TextDecoder();

/** @type {Promise<string>} */
let LIVERELOAD_SCRIPT_PROMISE;

/**
 * @param {ReadableStream<Uint8Array>} responseBody
 * @param {context.Context} context
 */
async function injectLivereloadScript(responseBody, context) {
    /** @type {Uint8Array[]} */
    const chunks = [];

    // double cast needed because ReadableStream is not async interable in ts types
    // (https://github.com/microsoft/TypeScript/issues/29867). This code is
    // server only, so it should be execute in nodjs, deno or bun, that have
    // async iterable ReadableStream
    const asyncIterableStream = /** @type {AsyncIterable<Uint8Array>} */ (
        /** @type {unknown} */ (responseBody)
    );

    for await (const chunk of asyncIterableStream) {
        chunks.push(chunk);
    }

    const bodyEncoded = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
    chunks.reduce((index, chunk) => {
        bodyEncoded.set(chunk, index);
        return index + chunk.length;
    }, 0);

    const body = DECODER.decode(bodyEncoded);

    if (LIVERELOAD_SCRIPT_PROMISE === undefined) {
        const liveReloadScriptURL = new URL(
            "../../watch/livereload/livereload.script.min.js",
            import.meta.url,
        );
        LIVERELOAD_SCRIPT_PROMISE =
            context.config.platform === "node"
                ? fs.readTextFile(path.fromFileURL(liveReloadScriptURL))
                : fetch(liveReloadScriptURL).then((response) => response.text());
    }

    const livreloadScript = await LIVERELOAD_SCRIPT_PROMISE;

    if (body.indexOf("</html>") !== -1) {
        return body.replace("</html>", `<script>${livreloadScript}</script></html>`);
    }
    return `${body}<script>${livreloadScript}</script>`;
}
