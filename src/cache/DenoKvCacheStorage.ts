import { CacheStorage, CacheStorageCreator } from "./CacheStorage.ts";

export class DenoKvCache implements CacheStorageCreator {
    #path?: string;

    constructor(path?: string) {
        this.#path = path;
    }

    instance() {
        return {
            import: { name: "DenoKvCacheStorage", url: import.meta.url },
            instanceParams: () => [`"${this.#path}"`],
        };
    }
}

export class DenoKvCacheStorage implements CacheStorage {
    #kv: Promise<Deno.Kv>;

    constructor(path?: string) {
        this.#kv = Deno.openKv(path);
    }

    async set(key: string, content: string) {
        const kv = await this.#kv;
        await kv.set(this.#key(key), content);
    }

    async get(key: string) {
        const kv = await this.#kv;

        const { value } = await kv.get(this.#key(key), { consistency: "eventual" });

        if (value !== null && typeof value === "string") {
            return value;
        }
    }

    async delete(key: string) {
        const kv = await this.#kv;
        await kv.delete(this.#key(key));
    }

    #key(key: string) {
        return ["__frugal", "__cache", key];
    }
}
