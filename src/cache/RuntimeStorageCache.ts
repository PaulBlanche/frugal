import * as http from "../../dep/std/http.ts";

import { GenerationResult, SerializedGenerationResult } from "../page/GenerationResult.ts";
import { JSONValue } from "../page/JSONValue.ts";
import { RuntimeCache } from "./Cache.ts";
import * as etag from "../server/etag.ts";
import { CacheStorage } from "./CacheStorage.ts";

export class RuntimeStorageCache implements RuntimeCache {
    #cacheStorage: CacheStorage;

    constructor(cacheStorage: CacheStorage) {
        this.#cacheStorage = cacheStorage;
    }

    async add<PATH extends string, DATA extends JSONValue>(generationResult: GenerationResult<PATH, DATA>) {
        return this.#cacheStorage.set(generationResult.path, JSON.stringify(await generationResult.serialize()));
    }

    async has(key: string): Promise<boolean> {
        const data = await this.#cacheStorage.get(key);
        if (data === undefined) {
            return false;
        }
        return true;
    }

    async get(key: string): Promise<Response | undefined> {
        const data = await this.#cacheStorage.get(key);
        if (data === undefined) {
            return undefined;
        }
        const generationResult: SerializedGenerationResult = JSON.parse(data);

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
