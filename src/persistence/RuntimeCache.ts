import { loadSerializedCache } from './BuildCache.ts';
import { Cache, CacheConfig } from './Cache.ts';
import { Persistence } from './Persistence.ts';

export class RuntimeCache<VALUE = unknown> implements Cache<VALUE> {
    #hash: string;
    #persistence: Persistence;

    constructor(config: CacheConfig) {
        this.#hash = config.hash;
        this.#persistence = config.persistence;
    }

    get hash() {
        return this.#hash;
    }

    async get(key: string) {
        const data = await this.#persistence.get([this.#hash, key]);
        if (data === undefined) {
            return undefined;
        }
        return JSON.parse(data);
    }

    set(key: string, value: VALUE) {
        return this.#persistence.set([this.#hash, key], JSON.stringify(value));
    }

    propagate() {}

    async values() {
        const serializedCache = await loadSerializedCache<VALUE>(
            this.#hash,
            this.#persistence,
        );
        if (serializedCache === undefined) {
            return [];
        }
        return Object.values(serializedCache.data);
    }

    save() {
        return Promise.resolve();
    }
}
