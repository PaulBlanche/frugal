import * as http from "../../dep/std/http.ts";
import * as xxhash from "../../dep/xxhash.ts";
import { Phase } from "../../page.ts";
import { JSONValue } from "./JSONValue.ts";
import { Assets, Render } from "./PageDescriptor.ts";
import { PathObject } from "./PathObject.ts";
import { PageResponse } from "./Response.ts";
import * as etag from "../server/etag.ts";

type GenerationResultInit<PATH extends string, DATA extends JSONValue> = {
    phase: Phase;
    path: PathObject<PATH>;
    pathname: string;
    moduleHash: string;
    configHash: string;
    render: Render<PATH, DATA>;
    descriptor: string;
    assets: Assets;
};

export type SerializedGenerationResult = {
    path: string;
    hash: string;
    body?: string;
    headers: [string, string][];
    status?: http.Status;
};

export class GenerationResult<PATH extends string, DATA extends JSONValue> {
    #pageResponse: PageResponse<DATA>;
    #init: GenerationResultInit<PATH, DATA>;
    #hash?: Promise<string>;
    #serialized?: SerializedGenerationResult;
    #body?: string | ReadableStream<string>;

    constructor(pageResponse: PageResponse<DATA>, init: GenerationResultInit<PATH, DATA>) {
        this.#pageResponse = pageResponse;
        this.#init = init;
    }

    async serialize(): Promise<SerializedGenerationResult> {
        if (this.#serialized === undefined) {
            const [hash, body] = await Promise.all([
                this.hash,
                this.body instanceof ReadableStream ? readStream(this.body) : this.body,
            ]);

            this.#serialized = {
                path: this.#init.pathname,
                hash,
                body,
                headers: Array.from(this.#pageResponse.headers.entries()),
                status: this.#pageResponse.status,
            };
        }

        return this.#serialized;
    }

    async toResponse(): Promise<Response> {
        const headers = new Headers(this.#pageResponse.headers);

        if (!headers.has("content-type")) {
            headers.set("Content-Type", "text/html; charset=utf-8");
        }

        if (!headers.has("etag") && typeof this.body === "string") {
            headers.set("Etag", await etag.compute(this.body));
        }

        return new Response(this.body, {
            headers,
            status: this.#pageResponse.status,
            statusText: this.#pageResponse.status ? http.STATUS_TEXT[this.#pageResponse.status] : undefined,
        });
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
            this.#body = this.#pageResponse.type === "data"
                ? this.#init.render({
                    phase: this.#init.phase,
                    path: this.#init.path,
                    pathname: this.#init.pathname,
                    descriptor: this.#init.descriptor,
                    assets: this.#init.assets,
                    data: this.#pageResponse.data!,
                })
                : undefined;
        }
        return this.#body;
    }

    get path() {
        return this.#init.pathname;
    }

    async #computeHash() {
        const hash = await xxhash.create();
        return hash
            .update(this.#pageResponse.dataHash ?? "")
            .update(this.#init.pathname)
            .update(this.#init.moduleHash)
            .update(this.#init.configHash)
            .digest("hex")
            .toString();
    }
}

async function readStream(stream: ReadableStream<string>): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return chunks.join("");
}
