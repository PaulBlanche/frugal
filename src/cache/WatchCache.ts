import * as http from "../../dep/std/http.ts";

import { RuntimeCache } from "./Cache.ts";
import { GenerationResult, SerializedGenerationResult } from "../page/GenerationResult.ts";
import { JSONValue } from "../page/JSONValue.ts";
import * as etag from "../server/etag.ts";

export type WatchCacheData = Record<string, SerializedGenerationResult>;

export class WatchCache implements RuntimeCache {
    #data: WatchCacheData;

    constructor(data: WatchCacheData = {}) {
        this.#data = data;
    }

    async add<PATH extends string, DATA extends JSONValue>(generationResult: GenerationResult<PATH, DATA>) {
        this.#data[generationResult.path] = {
            ...await generationResult.serialize(),
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
