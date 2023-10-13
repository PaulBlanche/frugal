import * as _type from "./_type/GenerationResult.js";
export * from "./_type/GenerationResult.js";

import * as xxhash from "../../dependencies/xxhash.js";

import * as jsonValue from "./JSONValue.js";
import * as response from "./Response.js";
import * as etag from "../server/etag.js";

/**
 * @template {string} PATH
 * @template {jsonValue.JSONValue} DATA
 */
export class GenerationResult {
    /** @type {response.PageResponse<DATA>} */
    #pageResponse;
    /** @type {_type.GenerationResultInit<PATH, DATA>} */
    #init;
    /** @type {Promise<string> | undefined} */
    #hash;
    /** @type {_type.SerializedGenerationResult | undefined} */
    #serialized;
    /** @type {string | ReadableStream<string> | undefined} */
    #body;

    /**
     * @param {response.PageResponse<DATA>} pageResponse
     * @param {_type.GenerationResultInit<PATH, DATA>} init
     */
    constructor(pageResponse, init) {
        this.#pageResponse = pageResponse;
        this.#init = init;
    }

    /** @returns {Promise<_type.SerializedGenerationResult>} */
    async serialize() {
        if (this.#serialized === undefined) {
            const [hash, body] = await Promise.all([
                this.hash,
                this.body instanceof ReadableStream ? readStream(this.body) : this.body,
            ]);

            this.#serialized = {
                path: this.#init.pathname,
                hash,
                body,
                headers: Array.from(this.headers.entries()),
                status: this.status,
            };
        }

        return this.#serialized;
    }

    get headers() {
        return this.#pageResponse.headers;
    }

    get status() {
        return this.#pageResponse.status;
    }

    get hash() {
        if (this.#hash === undefined) {
            this.#hash = this.#computeHash();
        }
        return this.#hash;
    }

    get body() {
        if (this.#body === undefined) {
            // do not use instanceof because classes are bundled inside the page
            // bundle, and have a different identity from the one from the
            // frugal module. Use brand `type` instead.
            this.#body =
                this.#pageResponse.type === "data"
                    ? this.#init.render({
                          phase: this.#init.phase,
                          path: this.#init.path,
                          pathname: this.#init.pathname,
                          descriptor: this.#init.descriptor,
                          assets: this.#init.assets,
                          data: this.#pageResponse.data,
                      })
                    : undefined;
        }
        return this.#body;
    }

    get path() {
        return this.#init.pathname;
    }

    async #computeHash() {
        return (await xxhash.create())
            .update(this.#pageResponse.dataHash ?? "")
            .update(this.#init.pathname)
            .update(this.#init.moduleHash)
            .update(this.#init.configHash)
            .digest();
    }
}

/**
 * @param {_type.SerializedGenerationResult | GenerationResult<string, jsonValue.JSONValue>} result
 * @returns {Promise<Response>}
 */
export async function toResponse(result) {
    const headers = new Headers(result.headers);

    if (!headers.has("content-type")) {
        headers.set("Content-Type", "text/html; charset=utf-8");
    }

    if (!headers.has("etag") && typeof result.body === "string") {
        headers.set("Etag", await etag.compute(result.body));
    }

    return new Response(result.body, {
        headers,
        status: result.status,
    });
}

/**
 * @param {ReadableStream<string>} stream
 * @returns {Promise<string>}
 */
async function readStream(stream) {
    /** @type {string[]} */
    const chunks = [];

    // double cast needed because ReadableStream is not async interable in ts types
    // (https://github.com/microsoft/TypeScript/issues/29867). This code is
    // server only, so it should be execute in nodjs, deno or bun, that have
    // async iterable ReadableStream
    const asyncIterableStream = /** @type {AsyncIterable<string>} */ (
        /** @type {unknown} */ (stream)
    );

    for await (const chunk of asyncIterableStream) {
        chunks.push(chunk);
    }
    return chunks.join("");
}
