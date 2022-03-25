import { Cache, CacheData } from '../Cache.ts';
import { spy } from '../../test_util/mod.ts';

type FakeCacheConfig = {
    previousData?: CacheData;
    nextData?: CacheData;
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
    { previousData = {}, nextData, mock = {} }: FakeCacheConfig = {},
) {
    const cache = new Cache(previousData, nextData);

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
