import { log } from '../log.ts';
import { Cache, CacheConfig, CacheData, SerializedCache } from './Cache.ts';
import { Persistence } from './Persistence.ts';

export class BuildCache<VALUE = unknown> implements Cache<VALUE> {
    #hash: string;
    #previousData: CacheData<VALUE>;
    #nextData: CacheData<VALUE>;
    #persistence: Persistence;

    static async load<VALUE>(config: CacheConfig) {
        log('load cache', {
            kind: 'debug',
            scope: 'BuildCache',
            extra: config.hash,
        });

        try {
            const serializedCache = await loadSerializedCache<VALUE>(
                config.hash,
                config.persistence,
            );

            if (serializedCache === undefined) {
                log('No data found in persistence, create empty cache', {
                    kind: 'debug',
                    scope: 'BuildCache',
                    extra: config.hash,
                });

                return new BuildCache<VALUE>(
                    { hash: config.hash, data: {} },
                    config,
                );
            }

            if (serializedCache.hash !== config.hash) {
                log('Cache hash has changed, create empty cache', {
                    kind: 'debug',
                    scope: 'BuildCache',
                    extra: config.hash,
                });

                try {
                    await config.persistence.delete([
                        config.hash,
                        '_cache.json',
                    ]);
                } catch {
                    /* empty on purpose */
                }

                return new BuildCache<VALUE>(
                    { hash: config.hash, data: {} },
                    config,
                );
            }

            return new BuildCache<VALUE>(serializedCache, config);
        } catch (error) {
            log(
                new Error(`Error while reading data`, {
                    cause: error,
                }),
                {
                    scope: 'BuildCache',
                    kind: 'debug',
                },
            );
            return new BuildCache<VALUE>(
                { hash: config.hash, data: {} },
                config,
            );
        }
    }

    constructor(
        serialized: SerializedCache<VALUE>,
        config: CacheConfig,
    ) {
        this.#hash = config.hash;
        this.#persistence = config.persistence;
        this.#previousData = serialized.data;
        this.#nextData = {};
    }
    get hash() {
        return this.#hash;
    }

    /**
     * Return the value associated to the given key (in hot data first, then cold)
     */
    get(key: string) {
        if (this.#has(key)) {
            return Promise.resolve(this.#nextData[key]);
        }
        if (this.#had(key)) {
            return Promise.resolve(this.#previousData[key]);
        }
        return Promise.resolve(undefined);
    }

    set(key: string, value: VALUE) {
        this.#nextData[key] = value;
        return Promise.resolve();
    }

    propagate(key: string) {
        if (this.#had(key) && !this.#has(key)) {
            this.set(key, this.#previousData[key]);
        }
    }

    #had(key: string) {
        return key in this.#previousData;
    }

    #has(key: string) {
        return key in this.#nextData;
    }

    values() {
        return Promise.resolve(Object.values(this.#nextData));
    }

    #serialize(): SerializedCache<VALUE> {
        return { hash: this.#hash ?? '', data: this.#nextData };
    }

    async save(): Promise<void> {
        const serialized = this.#serialize();
        await this.#persistence.set(
            [this.#hash, '_cache.json'],
            JSON.stringify(serialized),
        );

        for (const key in serialized.data) {
            await this.#persistence.set(
                [this.#hash, key],
                JSON.stringify(serialized.data[key]),
            );
        }
    }
}

export async function loadSerializedCache<VALUE>(
    hash: string,
    persistence: Persistence,
): Promise<SerializedCache<VALUE> | undefined> {
    const data = await persistence.get([hash, '_cache.json']);

    if (data === undefined) {
        return undefined;
    }

    return JSON.parse(data);
}
