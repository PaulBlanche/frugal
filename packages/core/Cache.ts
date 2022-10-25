import * as log from '../log/mod.ts';
import { Persistance } from './Persistance.ts';

export type SerializedCache = {
    hash: string;
    data: CacheData;
};

export type CacheData = {
    [s: string]: unknown;
};

type MemoizeConfig<V> = {
    key: string;
    producer: () => Promise<V> | V;
    otherwise?: () => Promise<void> | void;
};

function logger() {
    return log.getLogger('frugal:Cache');
}

export type CacheConfig = {
    hash?: string;
};

/**
 * Base Cache class
 */
export class Cache<VALUE = unknown> {
    #hash?: string;
    #previousData: CacheData;
    #nextData: CacheData;

    static unserialize(serialized?: SerializedCache, config?: CacheConfig) {
        if (serialized === undefined) {
            return new Cache({ hash: config?.hash ?? '', data: {} }, config);
        }
        return new Cache(serialized, config);
    }

    constructor(
        serialized: SerializedCache,
        config: CacheConfig = {},
    ) {
        this.#hash = config.hash;
        if (config.hash !== undefined && config.hash !== serialized.hash) {
            this.#previousData = {};
        } else {
            this.#previousData = serialized.data;
        }
        this.#nextData = {};
    }

    /**
     * Returns true if the key is present from the previous run (cold data)
     */
    had(key: string) {
        return key in this.#previousData;
    }

    /**
     * Returns true if the key is present from the current run (hot data)
     */
    has(key: string) {
        return key in this.#nextData;
    }

    /**
     * For a given `key`, call the `producer` function if the key is not present
     * (in hot or cold data).
     *
     * If the key is present in cold data, call the `otherwise` function, and
     * propagate the key and its value in hot data.
     *
     * It the key is present in hot data, call the `otherwise` function
     */
    async memoize<V = VALUE>(
        { key, producer, otherwise }: MemoizeConfig<V>,
    ): Promise<V> {
        if (!this.has(key)) {
            if (!this.had(key)) {
                this.set<Promise<V>>(
                    key,
                    Promise.resolve(producer()).then((v) => {
                        this.set<V>(key, v);
                        return v;
                    }),
                );
            } else {
                if (otherwise) {
                    await otherwise();
                }
                this.propagate(key);
            }
        } else {
            if (otherwise) {
                await otherwise();
            }
        }

        return Promise.resolve(this.get<Promise<V> | V>(key)!);
    }

    /**
     * Return the value associated to the given key (in hot data first, then cold)
     */
    get<V = VALUE>(key: string): V | undefined {
        if (this.has(key)) {
            return this.#nextData[key] as V;
        }
        if (this.had(key)) {
            return this.#previousData[key] as V;
        }
        return undefined;
    }

    /**
     * Set the value associated to the key in hot data
     */
    set<V = VALUE>(key: string, value: V) {
        this.#nextData[key] = value;
    }

    /**
     * If the key is cold, set it to hot data
     */
    propagate(key: string) {
        if (this.had(key) && !this.has(key)) {
            this.set(key, this.#previousData[key]);
        }
    }

    serialize(): SerializedCache {
        return { hash: this.#hash ?? '', data: this.#nextData };
    }
}

export type PersistantCacheConfig = CacheConfig & {
    persistance: Persistance;
};

/**
 * A Cache that can be persisted using a `Persistance` layer (filesystem, Redis,
 * etc...)
 */
export class PersistantCache<VALUE = unknown> extends Cache<VALUE> {
    #cachePath: string;
    #persistance: Persistance;

    /**
     * Load the cache from persistance. All persisted data is cold data, and
     * hot data is empty at first.
     */
    static async load(
        cachePath: string,
        config: PersistantCacheConfig,
    ) {
        logger().info({
            cachePath,
            msg() {
                return `loading ${this.cachePath}`;
            },
        });
        try {
            const data = await config.persistance.read(cachePath);
            const serializedCache: SerializedCache = JSON.parse(data);
            return new PersistantCache(
                cachePath,
                serializedCache,
                config,
            );
        } catch {
            logger().debug({
                cachePath,
                msg() {
                    return `no cache found at ${this.cachePath}, load pristine cache`;
                },
            });

            return new PersistantCache(cachePath, {
                hash: config.hash ?? '',
                data: {},
            }, config);
        }
    }

    constructor(
        cachePath: string,
        serializedCache: SerializedCache,
        config: PersistantCacheConfig,
    ) {
        super(serializedCache, config);
        this.#cachePath = cachePath;
        this.#persistance = config.persistance;
    }

    /**
     * Save the hot data to the persistance layer
     */
    async save(): Promise<void> {
        logger().info({
            cachePath: this.#cachePath,
            msg() {
                return `saving ${this.cachePath}`;
            },
        });

        await this.#persistance.set(
            this.#cachePath,
            JSON.stringify(this.serialize()),
        );
    }
}
