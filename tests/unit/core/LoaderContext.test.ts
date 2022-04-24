import { LoaderContext } from '../../../packages/core/LoaderContext.ts';
import { Asset } from '../../../packages/core/loader.ts';
import { fakePersistantCache } from './__fixtures__/Cache.ts';
import { fakeAsset, fakeLoader } from './__fixtures__/Loader.ts';
import { fakeConfig } from './__fixtures__/Config.ts';
import { asSpy } from '../../test_util/mod.ts';
import * as asserts from '../../../dep/std/asserts.ts';
import { assertSpyCall, assertSpyCalls, spy } from '../../../dep/std/mock.ts';

Deno.test('LoaderContext: build call all loader with correct assets', async () => {
    const fooLoader = fakeLoader({
        name: 'foo',
        generate: spy(() => Promise.resolve('foo-generated')),
    });
    const barLoader = fakeLoader({
        name: 'bar',
        generate: spy(() => Promise.resolve('bar-generated')),
    });

    const config = fakeConfig({
        loaders: [fooLoader, barLoader],
    });

    const assets: Asset[] = [
        fakeAsset({ loader: 'foo' }),
        fakeAsset({ loader: 'bar' }),
        fakeAsset({ loader: 'foo' }),
        fakeAsset({ loader: 'baz' }),
    ];

    await LoaderContext.build(config, assets, (_name) => {
        return Promise.resolve(fakePersistantCache());
    });

    assertSpyCalls(asSpy(fooLoader.generate), 1);
    asserts.assertEquals(
        asSpy(fooLoader.generate).calls[0].args[0].assets,
        assets.filter((asset) => asset.loader === 'foo'),
    );
    asserts.assertEquals(
        await asSpy(fooLoader.generate).calls[0].returned,
        'foo-generated',
    );

    assertSpyCalls(asSpy(barLoader.generate), 1);
    asserts.assertEquals(
        asSpy(barLoader.generate).calls[0].args[0].assets,
        assets.filter((asset) => asset.loader === 'bar'),
    );
    asserts.assertEquals(
        await asSpy(barLoader.generate).calls[0].returned,
        'bar-generated',
    );
});
