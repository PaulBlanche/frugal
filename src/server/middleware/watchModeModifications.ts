import { Context } from "../Context.ts";
import { Next } from "../Middleware.ts";

export async function watchModeModifications(context: Context, next: Next<Context>) {
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
    return new Response(await injectLivereloadScript(response.body), {
        headers,
        status: response.status,
        statusText: response.statusText,
    });
}

const DECODER = new TextDecoder();

let LIVERELOAD_SCRIPT_PROMISE: Promise<string>;

async function injectLivereloadScript(responseBody: ReadableStream<Uint8Array>) {
    const chunks = [];
    for await (const chunk of responseBody) {
        chunks.push(chunk);
    }

    const bodyEncoded = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
    chunks.reduce((index, chunk) => {
        bodyEncoded.set(chunk, index);
        return index + chunk.length;
    }, 0);

    const body = DECODER.decode(bodyEncoded);

    if (LIVERELOAD_SCRIPT_PROMISE === undefined) {
        LIVERELOAD_SCRIPT_PROMISE = fetch(
            new URL("../../watch/livereload/livereload.script.min.js", import.meta.url),
        ).then((response) => response.text());
    }

    const livreloadScript = await LIVERELOAD_SCRIPT_PROMISE;

    if (body.indexOf("</html>") !== -1) {
        return body.replace("</html>", `<script>${livreloadScript}</script></html>`);
    }
    return `${body}<script>${livreloadScript}</script>`;
}
