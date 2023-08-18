import * as fs from "../../dep/std/fs.ts";
import * as xxhash from "../../dep/xxhash.ts";

import { GenerationResult, SerializedGenerationResult } from "../page/GenerationResult.ts";
import { JSONValue } from "../page/JSONValue.ts";
import { FrugalConfig } from "../Config.ts";
import { RuntimeWatchCache, toResponse } from "./RuntimeWatchCache.ts";

type WatchCachEntry = SerializedGenerationResult & { updatedAt: number };

export class FsWatchCache extends RuntimeWatchCache {
    #config: FrugalConfig;
    #data: Map<string, string>;

    constructor(config: FrugalConfig) {
        super();
        this.#config = config;
        this.#data = new Map();
    }

    async add<PATH extends string, DATA extends JSONValue>(generationResult: GenerationResult<PATH, DATA>) {
        if (this.#data.has(generationResult.path)) {
            const previous = this.#data.get(generationResult.path)!;
            const hash = await generationResult.hash;
            if (previous === hash) {
                return;
            }
        }

        const data: WatchCachEntry = {
            ...await generationResult.serialize(),
            updatedAt: Date.now(),
        };

        this.#data.set(generationResult.path, await generationResult.hash);

        const pathHash = (await xxhash.create()).update(generationResult.path).digest("hex").toString();
        const url = new URL(`watchCache/${pathHash}`, this.#config.outdir);
        await fs.ensureFile(url);
        await Deno.writeTextFile(url, JSON.stringify(data));
    }

    has(path: string): Promise<boolean> {
        return Promise.resolve(this.#data.has(path));
    }

    async getData(path: string): Promise<WatchCachEntry | undefined> {
        const pathHash = (await xxhash.create()).update(path).digest("hex").toString();

        try {
            const url = new URL(`watchCache/${pathHash}`, this.#config.outdir);
            return JSON.parse(await Deno.readTextFile(url));
        } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
                throw error;
            }
            return undefined;
        }
    }

    async get(path: string): Promise<Response | undefined> {
        const generationResult = await this.getData(path);
        if (generationResult === undefined) {
            return undefined;
        }

        return await toResponse(generationResult);
    }
}
