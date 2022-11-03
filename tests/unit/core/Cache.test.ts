import * as asserts from '../../../dep/std/asserts.ts';
import { assertSpyCall, assertSpyCalls, spy } from '../../../dep/std/mock.ts';
import { fakePersistence } from './__fixtures__/Persistence.ts';

import { Cache, PersistentCache } from '../../../packages/core/Cache.ts';

Deno.test('Cache: Cached value is preserved in memory', async () => {
    const cache = await Cache.unserialize();

    const values: Record<string, any> = {};
    for (let i = 0; i < 10; i++) {
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

Deno.test('Cache: Cached value is lost after serialization and hash change', async () => {
    const cache = await Cache.unserialize(undefined, { hash: 'toto' });

    const values: Record<string, any> = {};
    for (let i = 0; i < 100; i++) {
        values[String(Math.random())] = {};
    }

    for (const [key, value] of Object.entries(values)) {
        cache.set(key, value);
    }

    const newCache = await Cache.unserialize(cache.serialize(), {
        hash: 'tata',
    });

    for (const [key, value] of Object.entries(values)) {
        asserts.assertEquals(newCache.get(key), undefined);
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
    ]);

    assertSpyCall(producer, 0, { args: [], returned: value });
    assertSpyCalls(producer, 1);

    assertSpyCall(otherwise, 0, { args: [], returned: undefined });
    assertSpyCalls(otherwise, 1);
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

    assertSpyCall(producer, 0, { args: [], returned: value });
    assertSpyCalls(producer, 1);

    assertSpyCalls(otherwise, 0);

    const newCache = await Cache.unserialize(cache.serialize());

    await Promise.all([
        newCache.memoize({ producer, otherwise, key: 'key' }),
    ]);

    assertSpyCalls(producer, 1);

    assertSpyCall(otherwise, 0, { args: [], returned: undefined });
    assertSpyCalls(otherwise, 1);
});

Deno.test('Cache: memoize keeps call results after save/load', async () => {
    const persistence = fakePersistence();

    const cache = await PersistentCache.load('path', { persistence });

    const value = {};

    const producer = spy(() => {
        return value;
    });

    const otherwise = spy(() => {
    });

    await cache.memoize({ producer, otherwise, key: 'key' });

    await cache.save();

    const newCache = await PersistentCache.load('path', { persistence });

    assertSpyCall(producer, 0, { args: [], returned: value });
    assertSpyCalls(producer, 1);

    assertSpyCalls(otherwise, 0);

    await Promise.all([
        newCache.memoize({ producer, otherwise, key: 'key' }),
    ]);

    assertSpyCalls(producer, 1);

    assertSpyCall(otherwise, 0, { args: [], returned: undefined });
    assertSpyCalls(otherwise, 1);
});
