import * as asserts from '../../dep/std/asserts.ts';
import { FakeFileSystem, spy } from '../test_util/mod.ts';

import { Cache, PersistantCache } from './Cache.ts';

Deno.test('Cache: Cached value is preserved in memory', async () => {
    const cache = await Cache.unserialize();

    const values: Record<string, any> = {};
    for (let i = 0; i < 100; i++) {
        values[String(Math.random())] = {};
    }

    for (const [key, value] of Object.entries(values)) {
        cache.set(key, value);
    }

    for (const [key, value] of Object.entries(values)) {
        asserts.assertStrictEquals(cache.get(key), value);
    }
});

Deno.test('Cache: Cached value is preserved after serialization', async () => {
    const cache = await Cache.unserialize();

    const values: Record<string, any> = {};
    for (let i = 0; i < 100; i++) {
        values[String(Math.random())] = {};
    }

    for (const [key, value] of Object.entries(values)) {
        cache.set(key, value);
    }

    const newCache = await Cache.unserialize(cache.serialize());

    for (const [key, value] of Object.entries(values)) {
        asserts.assertEquals(newCache.get(key), value);
    }
});

Deno.test('Cache: Cached data not propagated after serialization is lost', async () => {
    const cache = await Cache.unserialize();

    const values: Record<string, any> = {};
    for (let i = 0; i < 100; i++) {
        values[String(Math.random())] = {};
    }

    const propagated = Object.keys(values).slice(50);

    for (const [key, value] of Object.entries(values)) {
        cache.set(key, value);
    }

    const newCache = await Cache.unserialize(cache.serialize());

    for (const key of propagated) {
        newCache.propagate(key);
    }

    const newerCache = await Cache.unserialize(newCache.serialize());

    for (const [key, value] of Object.entries(values)) {
        if (propagated.includes(key)) {
            asserts.assertEquals(newerCache.get(key), value);
        } else {
            asserts.assertEquals(newerCache.get(key), undefined);
        }
    }
});

Deno.test('Cache: memoize keeps call results in memory', async () => {
    const cache = await Cache.unserialize();

    const value = {};

    const producer = spy(() => {
        return value;
    });

    const otherwise = spy(() => {
    });

    await Promise.all([
        cache.memoize({ producer, otherwise, key: 'key' }),
        cache.memoize({ producer, otherwise, key: 'key' }),
        cache.memoize({ producer, otherwise, key: 'key' }),
        cache.memoize({ producer, otherwise, key: 'key' }),
        cache.memoize({ producer, otherwise, key: 'key' }),
    ]);

    asserts.assertEquals(producer.calls, [{ params: [], result: value }]);
    asserts.assertEquals(otherwise.calls, [
        { params: [], result: undefined },
        { params: [], result: undefined },
        { params: [], result: undefined },
        { params: [], result: undefined },
    ]);
});

Deno.test('Cache: memoize keeps call results after serialization', async () => {
    const cache = await Cache.unserialize();

    const value = {};

    const producer = spy(() => {
        return value;
    });

    const otherwise = spy(() => {
    });

    await cache.memoize({ producer, otherwise, key: 'key' });

    const newCache = await Cache.unserialize(cache.serialize());

    await Promise.all([
        newCache.memoize({ producer, otherwise, key: 'key' }),
        newCache.memoize({ producer, otherwise, key: 'key' }),
        newCache.memoize({ producer, otherwise, key: 'key' }),
        newCache.memoize({ producer, otherwise, key: 'key' }),
        newCache.memoize({ producer, otherwise, key: 'key' }),
    ]);

    asserts.assertEquals(producer.calls, [{ params: [], result: value }]);
    asserts.assertEquals(otherwise.calls, [
        { params: [], result: undefined },
        { params: [], result: undefined },
        { params: [], result: undefined },
        { params: [], result: undefined },
        { params: [], result: undefined },
    ]);
});

Deno.test('Cache: memoize keeps call results after save/load', async () => {
    new FakeFileSystem();

    const cache = await PersistantCache.load('path');

    const value = {};

    const producer = spy(() => {
        return value;
    });

    const otherwise = spy(() => {
    });

    await cache.memoize({ producer, otherwise, key: 'key' });

    const fs: Record<string, string> = {};
    Deno.writeTextFile = (path, content) => {
        fs[String(path)] = content;
        return Promise.resolve();
    };

    Deno.readTextFile = (path) => Promise.resolve(fs[String(path)]);

    await cache.save();

    const newCache = await PersistantCache.load('path');

    await Promise.all([
        newCache.memoize({ producer, otherwise, key: 'key' }),
    ]);

    asserts.assertEquals(producer.calls, [{ params: [], result: value }]);
    asserts.assertEquals(otherwise.calls, [{ params: [], result: undefined }]);
});
