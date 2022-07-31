import {
    Cache,
    CacheConfig,
    CacheData,
    PersistantCache,
    PersistantCacheConfig,
    SerializedCache,
} from '../../../../packages/core/Cache.ts';
import { Persistance } from '../../../../packages/core/Persistance.ts';
import { spy } from '../../../../dep/std/mock.ts';
import { fakePersistance } from './Persistance.ts';

type FakeCacheConfig = {
    serialized?: SerializedCache;
    config?: CacheConfig;
    mock?: {
        has?: Cache['has'];
        had?: Cache['had'];
        memoize?: Cache['memoize'];
        get?: Cache['get'];
        set?: Cache['set'];
        propagate?: Cache['propagate'];
        serialize?: Cache['serialize'];
    };
};

export function fakeCache(
    { serialized, config, mock = {} }: FakeCacheConfig = {},
) {
    const cache = Cache.unserialize(serialized, config);

    const _has = cache.has;
    cache.has = spy(mock.has ?? _has.bind(cache));

    const _had = cache.had;
    cache.had = spy(mock.had ?? _had.bind(cache));

    const _memoize = cache.memoize;
    cache.memoize = spy(mock.memoize ?? _memoize.bind(cache));

    const _get = cache.get;
    cache.get = spy((mock.get as any) ?? _get.bind(cache));

    const _set = cache.set;
    cache.set = spy(mock.set ?? _set.bind(cache));

    const _propagate = cache.propagate;
    cache.propagate = spy(mock.propagate ?? _propagate.bind(cache));

    const _serialize = cache.serialize;
    cache.serialize = spy(mock.serialize ?? _serialize.bind(cache));

    return cache;
}

type FakPersistantCacheConfig = Omit<FakeCacheConfig, 'config'> & {
    cachePath?: string;
    config?: PersistantCacheConfig;
    mock?: FakeCacheConfig['mock'] & {
        save?: PersistantCache['save'];
    };
};

export function fakePersistantCache(
    {
        config = {
            persistance: fakePersistance(),
        },
        serialized = { hash: config?.hash ?? '', data: {} },
        cachePath = '',
        mock = {},
    }: FakPersistantCacheConfig = {},
) {
    const peristantCache = new PersistantCache(
        cachePath,
        serialized,
        config,
    );

    const _has = peristantCache.has;
    peristantCache.has = spy(mock.has ?? _has.bind(peristantCache));

    const _had = peristantCache.had;
    peristantCache.had = spy(mock.had ?? _had.bind(peristantCache));

    const _memoize = peristantCache.memoize;
    peristantCache.memoize = spy(mock.memoize ?? _memoize.bind(peristantCache));

    const _get = peristantCache.get;
    peristantCache.get = spy((mock.get as any) ?? _get.bind(peristantCache));

    const _set = peristantCache.set;
    peristantCache.set = spy(mock.set ?? _set.bind(peristantCache));

    const _propagate = peristantCache.propagate;
    peristantCache.propagate = spy(
        mock.propagate ?? _propagate.bind(peristantCache),
    );

    const _serialize = peristantCache.serialize;
    peristantCache.serialize = spy(
        mock.serialize ?? _serialize.bind(peristantCache),
    );

    const _save = peristantCache.save;
    peristantCache.save = spy(
        mock.save ?? _save.bind(peristantCache),
    );

    return peristantCache;
}
