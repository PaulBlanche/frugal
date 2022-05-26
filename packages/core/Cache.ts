import * as log from '../log/mod.ts';
import { Persistance } from './Persistance.ts';

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

/**
 * Base Cache class
 */
export class Cache<VALUE = unknown> {
    private previousData: CacheData;
    private nextData: CacheData;

    static unserialize(data?: CacheData) {
        if (data === undefined) {
            return new Cache({});
        }
        return new Cache(data);
    }

    constructor(
        previousData: CacheData,
        nextData: CacheData = {},
    ) {
        this.previousData = previousData;
        this.nextData = nextData;
    }

    /**
     * Returns true if the key is present from the previous run (cold data)
     */
    had(key: string) {
        return key in this.previousData;
    }

    /**
     * Returns true if the key is present from the current run (hot data)
     */
    has(key: string) {
        return key in this.nextData;
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
            return this.nextData[key] as V;
        }
        if (this.had(key)) {
            return this.previousData[key] as V;
        }
        return undefined;
    }

    /**
     * Set the value associated to the key in hot data
     */
    set<V = VALUE>(key: string, value: V) {
        this.nextData[key] = value;
    }

    /**
     * If the key is cold, set it to hot data
     */
    propagate(key: string) {
        if (this.had(key) && !this.has(key)) {
            this.set(key, this.previousData[key]);
        }
    }

    serialize(): CacheData {
        return this.nextData;
    }

    toJSON() {
        return { nextData: this.nextData, previousData: this.previousData };
    }
}

/**
 * A Cache that can be persisted using a `Persistance` layer (filesystem, Redis,
 * etc...)
 */
export class PersistantCache<VALUE = unknown> extends Cache<VALUE> {
    private cachePath: string;
    private persistance: Persistance;

    /**
     * Load the cache from persistance. All persisted data is cold data, and
     * hot data is empty at first.
     */
    static async load(persistance: Persistance, cachePath: string) {
        logger().info({
            cachePath,
            msg() {
                return `loading ${this.cachePath}`;
            },
        });
        try {
            const data = await persistance.get(cachePath);
            return new PersistantCache(
                persistance,
                cachePath,
                JSON.parse(data),
            );
        } catch {
            logger().debug({
                cachePath,
                msg() {
                    return `no cache found at ${this.cachePath}, load pristine cache`;
                },
            });

            return new PersistantCache(persistance, cachePath, {});
        }
    }

    constructor(
        persistance: Persistance,
        cachePath: string,
        previousData: CacheData,
        nextData: CacheData = {},
    ) {
        super(previousData, nextData);
        this.cachePath = cachePath;
        this.persistance = persistance;
    }

    /**
     * Save the hot data to the persistance layer
     */
    async save(): Promise<void> {
        logger().info({
            cachePath: this.cachePath,
            msg() {
                return `saving ${this.cachePath}`;
            },
        });

        await this.persistance.set(
            this.cachePath,
            JSON.stringify(this.serialize()),
        );
    }
}
