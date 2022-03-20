import { CleanConfig } from './Config.ts';
import { Entrypoint } from './Entrypoint.ts';
import {
    DynamicPage,
    DynamicPageDescriptor,
    StaticPage,
    StaticPageDescriptor,
} from './Page.ts';
import { EntrypointLoader } from './EntrypointLoader.ts';
import * as asserts from '../../dep/std/asserts.ts';

Deno.test('EntrypointLoader: given a config and a dependency tree, load pages', async () => {
    const config = fakeConfig({
        entrypoint: [
            fakeEntrypoint('foo.ts', '/', {
                pattern: '',
                getContent() {
                    return '';
                },
                getDynamicData() {},
            }),
            fakeEntrypoint('baz.ts', '/', {
                pattern: '',
                getContent() {
                    return '';
                },
                getRequestList() {
                    return Promise.resolve([]);
                },
                getStaticData() {
                    return;
                },
            }),
        ],
    });

    const loader = new EntrypointLoader(config);
    const loaded = await loader.load({
        type: 'root',
        hash: '',
        dependencies: [{
            type: 'module',
            entrypoint: new URL('file:///foo.ts'),
            url: new URL('file:///foo.ts'),
            moduleHash: 'foo',
            contentHash: '',
            dependencies: [],
        }, {
            type: 'module',
            entrypoint: new URL('file:///baz.ts'),
            url: new URL('file:///baz.ts'),
            moduleHash: 'baz',
            contentHash: '',
            dependencies: [],
        }],
    });

    asserts.assert(loaded[0] instanceof DynamicPage);
    asserts.assertEquals(loaded[0].hash, 'foo');
    asserts.assertEquals(loaded[0].path, 'file:///foo.ts');
    asserts.assert(loaded[1] instanceof StaticPage);
    asserts.assertEquals(loaded[1].hash, 'baz');
    asserts.assertEquals(loaded[1].path, 'file:///baz.ts');
});

function fakeConfig(conf: { entrypoint: Entrypoint[] }) {
    const config = new CleanConfig({
        root: '',
        outputDir: '',
        pages: [],
    }, {});

    config.entrypoints = conf.entrypoint;

    return config;
}

function fakeEntrypoint(
    path: string,
    root: string,
    descriptor:
        | DynamicPageDescriptor<any, any>
        | StaticPageDescriptor<any, any>,
) {
    const entrypoint = new Entrypoint(path, root);
    entrypoint.getDescriptor = () => {
        return Promise.resolve(descriptor);
    };

    return entrypoint;
}
