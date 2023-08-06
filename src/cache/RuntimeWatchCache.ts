import * as http from "../../dep/std/http.ts";

import { RuntimeCache } from "./Cache.ts";
import { GenerationResult, SerializedGenerationResult } from "../page/GenerationResult.ts";
import { JSONValue } from "../page/JSONValue.ts";
import * as etag from "../server/etag.ts";

export type WatchCacheData = Record<string, SerializedGenerationResult & { updatedAt: number }>;

export class RuntimeWatchCache implements RuntimeCache {
    #data: WatchCacheData;

    constructor(data: WatchCacheData = {}) {
        this.#data = data;
    }

    get _data() {
        return this.#data;
    }

    async add<PATH extends string, DATA extends JSONValue>(generationResult: GenerationResult<PATH, DATA>) {
        if (generationResult.path in this.#data) {
            const previous = this.#data[generationResult.path];
            const hash = await generationResult.hash;
            if (previous.hash === hash) {
                return;
            }
        }

        this.#data[generationResult.path] = {
            ...await generationResult.serialize(),
            updatedAt: Date.now(),
        };
    }

    has(path: string): Promise<boolean> {
        const generationResult = this.#data[path];
        if (generationResult === undefined) {
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }

    async get(path: string): Promise<Response | undefined> {
        const generationResult = this.#data[path];
        if (generationResult === undefined) {
            return undefined;
        }

        const headers = new Headers(generationResult.headers);

        if (!headers.has("content-type")) {
            headers.set("Content-Type", "text/html; charset=utf-8");
        }

        if (!headers.has("etag") && generationResult.body !== undefined) {
            headers.set("Etag", await etag.compute(generationResult.body));
        }

        return new Response(generationResult.body, {
            headers,
            status: generationResult.status,
            statusText: generationResult.status ? http.STATUS_TEXT[generationResult.status] : undefined,
        });
    }
}
