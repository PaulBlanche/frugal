import {
    Cache,
    CacheConfig,
    CacheData,
    PersistentCache,
    PersistentCacheConfig,
    SerializedCache,
} from '../../../../packages/core/Cache.ts';
import { Persistence } from '../../../../packages/core/Persistence.ts';
import { spy } from '../../../../dep/std/mock.ts';
import { fakePersistence } from './Persistence.ts';

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

type FakePersistentCacheConfig = Omit<FakeCacheConfig, 'config'> & {
    cachePath?: string;
    config?: PersistentCacheConfig;
    mock?: FakeCacheConfig['mock'] & {
        save?: PersistentCache['save'];
    };
};

export function fakePersistentCache(
    {
        config = {
            persistence: fakePersistence(),
        },
        serialized = { hash: config?.hash ?? '', data: {} },
        cachePath = '',
        mock = {},
    }: FakePersistentCacheConfig = {},
) {
    const peristentCache = new PersistentCache(
        cachePath,
        serialized,
        config,
    );

    const _has = peristentCache.has;
    peristentCache.has = spy(mock.has ?? _has.bind(peristentCache));

    const _had = peristentCache.had;
    peristentCache.had = spy(mock.had ?? _had.bind(peristentCache));

    const _memoize = peristentCache.memoize;
    peristentCache.memoize = spy(mock.memoize ?? _memoize.bind(peristentCache));

    const _get = peristentCache.get;
    peristentCache.get = spy((mock.get as any) ?? _get.bind(peristentCache));

    const _set = peristentCache.set;
    peristentCache.set = spy(mock.set ?? _set.bind(peristentCache));

    const _propagate = peristentCache.propagate;
    peristentCache.propagate = spy(
        mock.propagate ?? _propagate.bind(peristentCache),
    );

    const _serialize = peristentCache.serialize;
    peristentCache.serialize = spy(
        mock.serialize ?? _serialize.bind(peristentCache),
    );

    const _save = peristentCache.save;
    peristentCache.save = spy(
        mock.save ?? _save.bind(peristentCache),
    );

    return peristentCache;
}
