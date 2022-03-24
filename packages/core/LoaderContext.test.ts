import { LoaderContext } from './LoaderContext.ts';
import { CleanConfig } from './Config.ts';
import { Asset, Loader } from './loader.ts';
import { PersistantCache } from './Cache.ts';
import { asSpy, spy } from '../test_util/mod.ts';
import * as asserts from '../../dep/std/asserts.ts';

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

    await LoaderContext.build(config, assets, (name) => {
        return Promise.resolve(new PersistantCache('', {}));
    });

    asserts.assertEquals(asSpy(fooLoader.generate).calls.length, 1);
    asserts.assertEquals(
        asSpy(fooLoader.generate).calls[0].params[0].assets,
        assets.filter((asset) => asset.loader === 'foo'),
    );
    asserts.assertEquals(
        await asSpy(fooLoader.generate).calls[0].result,
        'foo-generated',
    );

    asserts.assertEquals(asSpy(barLoader.generate).calls.length, 1);
    asserts.assertEquals(
        asSpy(barLoader.generate).calls[0].params[0].assets,
        assets.filter((asset) => asset.loader === 'bar'),
    );
    asserts.assertEquals(
        await asSpy(barLoader.generate).calls[0].result,
        'bar-generated',
    );
});

function fakeAsset(asset: Partial<Asset>) {
    return {
        loader: asset.loader ?? '',
        module: asset.module ?? '',
        hash: asset.hash ?? '',
        entrypoint: asset.entrypoint ?? '',
    };
}

function fakeConfig(config: { loaders: Loader<any, any>[] }) {
    return new CleanConfig({
        self: new URL('file:///'),
        outputDir: '',
        pages: [],
        loaders: config.loaders,
    }, {});
}

function fakeLoader(loader: Partial<Loader<any, any>>) {
    return {
        name: loader.name ?? '',
        test: loader.test ?? (() => true),
        generate: loader.generate ?? (() => Promise.resolve()),
    };
}
