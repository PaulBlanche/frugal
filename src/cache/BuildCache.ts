import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";
import * as xxhash from "../../dep/xxhash.ts";
import * as http from "../../dep/std/http.ts";

import { Cache } from "./Cache.ts";
import { FrugalConfig } from "../Config.ts";
import { GenerationResult } from "../page/GenerationResult.ts";
import { JSONValue } from "../page/JSONValue.ts";
import { log } from "../log.ts";

export type BuildCacheEntry = {
    path: string;
    hash: string;
    documentPath?: string;
    headers: [string, string][];
    status?: http.Status;
    age: "new" | "old";
};

export type BuildCacheData = Record<string, BuildCacheEntry>;

export type SerializedBuildCache = { current: BuildCacheData; previous: BuildCacheData };

export class BuildCache implements Cache {
    #config: FrugalConfig;
    #previous: BuildCacheData;
    #current: BuildCacheData;

    static async load(config: FrugalConfig) {
        const data = await loadBuildCacheData(config);
        return new BuildCache(config, data?.current);
    }

    constructor(config: FrugalConfig, previous: BuildCacheData = {}) {
        this.#config = config;
        this.#previous = previous;
        this.#current = {};
    }

    async add<PATH extends string, DATA extends JSONValue>(generationResult: GenerationResult<PATH, DATA>) {
        log(`Add response "${generationResult.path}"`, { scope: "BuildCache", level: "verbose" });

        if (generationResult.path in this.#previous) {
            const previous = this.#previous[generationResult.path];
            const hash = await generationResult.hash;
            if (previous.hash === hash) {
                log(`keep previous response for path ${generationResult.path}`, {
                    scope: "BuildCache",
                    level: "verbose",
                });
                this.#current[generationResult.path] = this.#previous[generationResult.path];
                this.#current[generationResult.path].age = "old";
                return;
            }
        }

        log(`replace previous response for path ${generationResult.path}`, { scope: "BuildCache", level: "verbose" });
        const serialized = await generationResult.serialize();
        const name = (await xxhash.create()).update(generationResult.path).digest("hex").toString();
        const entry: BuildCacheEntry = {
            path: serialized.path,
            hash: serialized.hash,
            headers: serialized.headers,
            status: serialized.status,
            age: "new",
        };
        if (serialized.body) {
            const bodyPath = path.fromFileUrl(new URL(`./buildcache/${name}`, this.#config.buildCacheFile));
            await fs.ensureFile(bodyPath);
            await Deno.writeTextFile(bodyPath, serialized.body);
            entry.documentPath = `./buildcache/${name}`;
        }
        this.#current[generationResult.path] = entry;
    }

    async save() {
        const filePath = path.fromFileUrl(this.#config.buildCacheFile);

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(
            filePath,
            JSON.stringify({ current: this.#current, previous: this.#previous }, undefined, 2),
        );
    }
}

export async function loadBuildCacheData(
    config: FrugalConfig,
): Promise<SerializedBuildCache | undefined> {
    try {
        const filePath = path.fromFileUrl(config.buildCacheFile);
        const data = await Deno.readTextFile(filePath);

        return JSON.parse(data);
    } catch {
        return undefined;
    }
}
