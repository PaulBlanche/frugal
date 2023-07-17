import * as fs from "../../dep/std/fs.ts";

import { CacheStorage } from "./CacheStorage.ts";

export class FilesystemCacheStorage implements CacheStorage {
    #root: URL;
    constructor(root: URL) {
        this.#root = root;
    }

    async set(key: string, content: string) {
        const url = this.#url(key);
        await fs.ensureFile(url);
        return await Deno.writeTextFile(url, content);
    }

    async get(key: string) {
        try {
            return await Deno.readTextFile(this.#url(key));
        } catch (error: unknown) {
            if (error instanceof Deno.errors.NotFound) {
                return undefined;
            }
            throw error;
        }
    }

    async delete(key: string) {
        return await Deno.remove(this.#url(key));
    }

    async empty(): Promise<void> {
        try {
            const promises = [];

            for await (const entry of Deno.readDir(this.#root)) {
                promises.push(Deno.remove(new URL(entry.name, this.#root)));
            }

            await Promise.all(promises);
        } catch (error) {
            if (error instanceof Deno.errors.NotFound) {
                // swallow error, yum
            } else {
                throw error;
            }
        }
    }

    #url(key: string) {
        if (key.startsWith("/")) {
            return new URL(`.${key}`, this.#root);
        }
        return new URL(key, this.#root);
    }
}
