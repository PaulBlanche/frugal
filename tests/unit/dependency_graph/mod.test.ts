import * as asserts from '../../../dep/std/asserts.ts';
import * as murmur from '../../../packages/murmur/mod.ts';
import { asSpy, decycle } from '../../test_util/mod.ts';
import { spy } from '../../../dep/std/mock.ts';

import * as dependency from '../../../packages/dependency_graph/mod.ts';
import * as graph from '../../../packages/dependency_graph/graph.ts';

Deno.test('dependency_graph: file without dependencies', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
            //entrypoint1.ts
        `,
        'file:///entrypoint2.ts': `
            //entrypoint2.ts
        `,
        'http://localhost/entrypoint3.ts': `
            //entrypoint3.ts
        `,
    });

    const tree = await dependency.build([
        new URL('file:///entrypoint1.ts'),
        new URL('file:///entrypoint2.ts'),
        new URL('http://localhost/entrypoint3.ts'),
    ]);

    asserts.assertEquals(
        asSpy(Deno.readTextFile).calls.map((call) => call.args[0].toString()),
        [
            'file:///entrypoint1.ts',
            'file:///entrypoint2.ts',
        ],
        'each local file should be read once',
    );

    asserts.assertEquals<graph.Root>(
        tree,
        root(ffs, {
            dependencies: [{
                url: new URL('file:///entrypoint1.ts'),
                entrypoint: new URL('file:///entrypoint1.ts'),
            }, {
                url: new URL('file:///entrypoint2.ts'),
                entrypoint: new URL('file:///entrypoint2.ts'),
            }, {
                url: new URL('http://localhost/entrypoint3.ts'),
                entrypoint: new URL('http://localhost/entrypoint3.ts'),
            }],
        }),
    );
});

Deno.test('dependency_graph: files with basic tree dependency', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
            import './module1.ts'
            import 'https://localhost/module2.ts'
        `,
        'file:///module1.ts': `
            import './module11.ts'
        `,
        'https://localhost/module2.ts': `
            import './module21.ts'
            //module2.ts
        `,
        'file:///module11.ts': `
            //module11.ts
        `,
        'https://localhost/module21.ts': `
            //module21.ts
    `,
    });

    const tree = await dependency.build([new URL('file:///entrypoint1.ts')]);

    asserts.assertEquals(
        asSpy(Deno.readTextFile).calls.map((call) => call.args[0].toString()),
        [
            'file:///entrypoint1.ts',
            'file:///module1.ts',
            'file:///module11.ts',
        ],
        'each local file should be read once',
    );

    asserts.assertEquals<graph.Root>(
        tree,
        root(ffs, {
            dependencies: [{
                url: new URL('file:///entrypoint1.ts'),
                entrypoint: new URL('file:///entrypoint1.ts'),
                dependencies: [{
                    url: new URL('file:///module1.ts'),
                    dependencies: [{
                        url: new URL('file:///module11.ts'),
                    }],
                }, {
                    url: new URL('https://localhost/module2.ts'),
                }],
            }],
        }),
    );
});

Deno.test('dependency_graph: files with acyclic graph dependency', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
            import './foo.ts'
            import 'https://localhost/remote.ts'
            import './module1.ts'
            import './module2.ts'
        `,
        'file:///module1.ts': `
            import './module11.ts'
            import 'https://localhost/bar.ts'
            import './foo.ts'
        `,
        'file:///module2.ts': `
            import './foo.ts'
        `,
        'file:///module11.ts': `
            import './foo.ts'
        `,
        'file:///foo.ts': `
            //foo.ts
        `,
        'https://localhost/remote.ts': `
            import './bar.ts'
        `,
        'https://localhost/bar.ts': `
            // bar.ts
    `,
    });

    const tree = await dependency.build([new URL('file:///entrypoint1.ts')]);

    asserts.assertEquals(
        asSpy(Deno.readTextFile).calls.map((call) => call.args[0].toString()),
        [
            'file:///entrypoint1.ts',
            'file:///foo.ts',
            'file:///module1.ts',
            'file:///module11.ts',
            'file:///module2.ts',
        ],
        'each local file should be read once',
    );

    asserts.assertEquals<graph.Root>(
        tree,
        root(ffs, {
            dependencies: [{
                url: new URL('file:///entrypoint1.ts'),
                entrypoint: new URL('file:///entrypoint1.ts'),
                dependencies: [{
                    url: new URL('file:///foo.ts'),
                }, {
                    url: new URL('https://localhost/remote.ts'),
                }, {
                    url: new URL('file:///module1.ts'),
                    dependencies: [{
                        url: new URL('file:///module11.ts'),
                        dependencies: [{
                            url: new URL('file:///foo.ts'),
                        }],
                    }, {
                        url: new URL('https://localhost/bar.ts'),
                    }, {
                        url: new URL('file:///foo.ts'),
                    }],
                }, {
                    url: new URL('file:///module2.ts'),
                    dependencies: [{
                        url: new URL('file:///foo.ts'),
                    }],
                }],
            }],
        }),
    );
});

Deno.test('dependency_graph: files with cyclic graph dependency', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
            import './module1.ts'
        `,
        'file:///module1.ts': `
            import './module2.ts'
        `,
        'file:///module2.ts': `
            import './module1.ts'
        `,
    });

    const tree = await dependency.build([new URL('file:///entrypoint1.ts')]);

    asserts.assertEquals(
        asSpy(Deno.readTextFile).calls.map((call) => call.args.toString()),
        [
            'file:///entrypoint1.ts',
            'file:///module1.ts',
            'file:///module2.ts',
        ],
        'each file should be read once',
    );

    const entrpointUrl = new URL('file:///entrypoint1.ts');

    const baseModule1 = module(ffs, {
        url: new URL('file:///module1.ts'),
        entrypoint: entrpointUrl,
    });
    baseModule1.moduleHash = baseModule1.contentHash;
    const module2 = module(ffs, {
        url: new URL('file:///module2.ts'),
        entrypoint: entrpointUrl,
        dependencies: [baseModule1],
    });
    const module1 = module(ffs, {
        url: new URL('file:///module1.ts'),
        entrypoint: entrpointUrl,
        dependencies: [module2],
    });
    module2.dependencies = [module1];

    asserts.assertEquals<graph.Root>(
        decycle(tree),
        decycle(root(ffs, {
            dependencies: [{
                url: entrpointUrl,
                entrypoint: entrpointUrl,
                dependencies: [module1],
            }],
        })),
    );
});

Deno.test('dependency_graph: multiple entrypoints sharing dependencies', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
        import './foo.ts'
        import './module1.ts'
    `,
        'file:///entrypoint2.ts': `
        import './foo.ts'
        import './module2.ts'
    `,
        'file:///foo.ts': `
        //foo.ts
    `,
        'file:///module1.ts': `
        //module1.ts
    `,
        'file:///module2.ts': `
        //module2.ts
    `,
    });

    const tree = await dependency.build([
        new URL('file:///entrypoint1.ts'),
        new URL('file:///entrypoint2.ts'),
    ]);

    asserts.assertEquals(
        asSpy(Deno.readTextFile).calls.map((call) => call.args[0].toString()),
        [
            'file:///entrypoint1.ts',
            'file:///entrypoint2.ts',
            'file:///foo.ts',
            'file:///module1.ts',
            'file:///module2.ts',
        ],
        'each file should be read once',
    );

    asserts.assertEquals<graph.Root>(
        tree,
        root(ffs, {
            dependencies: [{
                url: new URL('file:///entrypoint1.ts'),
                entrypoint: new URL('file:///entrypoint1.ts'),
                dependencies: [{
                    url: new URL('file:///foo.ts'),
                }, {
                    url: new URL('file:///module1.ts'),
                }],
            }, {
                url: new URL('file:///entrypoint2.ts'),
                entrypoint: new URL('file:///entrypoint2.ts'),
                dependencies: [{
                    url: new URL('file:///foo.ts'),
                }, {
                    url: new URL('file:///module2.ts'),
                }],
            }],
        }),
    );
});

Deno.test('dependency_graph: custom resolution/loading', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
        import 'foo.ts'
        import 'bar.ts'
    `,
        'file:///foo.ts': `
        // foo.ts
    `,
        'file:///virtual-bar.ts': `
        // bar.ts
    `,
    });

    const resolve = spy((specifier: string) => {
        if (specifier === 'foo.ts') {
            return new URL('file:///foo.ts');
        }
        if (specifier === 'bar.ts') {
            return new URL('virtual:///bar.ts');
        }
    });

    const load = spy((resolvedModuleSpecifier: URL) => {
        if (resolvedModuleSpecifier.protocol === 'virtual:') {
            if (resolvedModuleSpecifier.pathname === '/bar.ts') {
                return Promise.resolve(ffs.get('file:///virtual-bar.ts'));
            }
        }
    });

    const tree = await dependency.build([
        new URL('file:///entrypoint1.ts'),
    ], { resolve, load });

    asserts.assertEquals(
        asSpy(Deno.readTextFile).calls.map((call) => call.args[0].toString()),
        [
            'file:///entrypoint1.ts',
            'file:///foo.ts',
        ],
        'each file should be read once',
    );

    asserts.assertEquals(
        await Promise.all(
            asSpy(load).calls.map(async (call) => ({
                args: call.args[0].toString(),
                returned: await call.returned,
            })),
        ),
        [
            { args: 'file:///entrypoint1.ts', returned: undefined },
            { args: 'file:///foo.ts', returned: undefined },
            {
                args: 'virtual:///bar.ts',
                returned: '\n        // bar.ts\n    ',
            },
        ],
    );

    asserts.assertEquals<graph.Root>(
        tree,
        root(ffs, {
            dependencies: [{
                url: new URL('file:///entrypoint1.ts'),
                entrypoint: new URL('file:///entrypoint1.ts'),
                dependencies: [{
                    url: new URL('file:///foo.ts'),
                }, {
                    ...module(ffs, {
                        url: new URL('file:///virtual-bar.ts'),
                        entrypoint: new URL('file:///entrypoint1.ts'),
                    }),
                    url: new URL('virtual:///bar.ts'),
                    id: 'file:///entrypoint1.ts:virtual:///bar.ts',
                }],
            }],
        }),
    );
});

Deno.test('dependency_graph: handling all kind of imports', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
            import './bare-import.ts'
            import foo from './default-import.ts'
            import { bar } from './named-import.ts'
            import foobar, { baz } from './default-and-named-import.ts'
            export { quux } from './named-export-from.ts'
            export * from './export-all-from.ts'
        `,
        'file:///bare-import.ts': `
            //bare-import.ts
        `,
        'file:///default-import.ts': `
            //default-import.ts
        `,
        'file:///named-import.ts': `
            //named-import.ts
        `,
        'file:///default-and-named-import.ts': `
            //default-and-named-import.ts
        `,
        'file:///named-export-from.ts': `
            //named-export-from.ts
        `,
        'file:///export-all-from.ts': `
            //export-all-from.ts
        `,
    });

    const tree = await dependency.build([new URL('file:///entrypoint1.ts')]);

    asserts.assertEquals<graph.Root>(
        tree,
        root(ffs, {
            dependencies: [{
                url: new URL('file:///entrypoint1.ts'),
                entrypoint: new URL('file:///entrypoint1.ts'),
                dependencies: [{
                    url: new URL('file:///bare-import.ts'),
                }, {
                    url: new URL('file:///default-import.ts'),
                }, {
                    url: new URL('file:///named-import.ts'),
                }, {
                    url: new URL('file:///default-and-named-import.ts'),
                }, {
                    url: new URL('file:///named-export-from.ts'),
                }, {
                    url: new URL('file:///export-all-from.ts'),
                }],
            }],
        }),
    );
});

Deno.test('dependency_graph: files with basic tree dependency and excludes', async () => {
    const ffs = new FakeEnvironment({
        'file:///entrypoint1.ts': `
            import './module1.ts'
            import './module2.ts'
        `,
        'file:///module1.ts': `
            import './module11.ts'
        `,
        'file:///module2.ts': `
            import './module21.ts'
            //module2.ts
        `,
        'file:///module11.ts': `
            //module11.ts
        `,
        'file:///module21.ts': `
            //module21.ts
    `,
    });

    const tree = await dependency.build([new URL('file:///entrypoint1.ts')], {
        excludes: [new URL('file:///module2.ts')],
    });

    asserts.assertEquals(
        asSpy(Deno.readTextFile).calls.map((call) => call.args[0].toString()),
        [
            'file:///entrypoint1.ts',
            'file:///module1.ts',
            'file:///module11.ts',
        ],
        'each local file should be read once',
    );

    asserts.assertEquals<graph.Root>(
        tree,
        root(ffs, {
            dependencies: [{
                url: new URL('file:///entrypoint1.ts'),
                entrypoint: new URL('file:///entrypoint1.ts'),
                dependencies: [{
                    url: new URL('file:///module1.ts'),
                    dependencies: [{
                        url: new URL('file:///module11.ts'),
                    }],
                }],
            }],
        }),
    );
});
class FakeEnvironment {
    env: Map<string, string>;

    constructor(fs: { [s: string]: string } = {}) {
        this.env = new Map<string, string>(Object.entries(fs));
        Deno.readTextFile = spy((path) => this.fakeReadFileText(path));
        Deno.writeTextFile = spy((path, content) =>
            this.fakeWriteFileText(path, content)
        );
        const realFetch = globalThis.fetch;
        globalThis.fetch = spy((url) => {
            if (
                url.toString() ===
                    'https://cdn.esm.sh/v78/@swc/wasm-web@1.2.172/deno/wasm-web_bg.wasm'
            ) {
                return realFetch(url);
            }
            return this.fakeFetch(url);
        });
    }

    set(path: string, content: string) {
        this.env.set(path, content);
    }

    get(path: string) {
        const content = this.env.get(path);
        if (content === undefined) {
            throw Error(`path ${path} not found`);
        }
        return content;
    }

    hash(path: string) {
        if (path.startsWith('http')) {
            return new murmur.Hash().update(`//${path}`).digest();
        }
        return new murmur.Hash().update(this.get(path)).digest();
    }

    fakeReadFileText(path: string | URL) {
        if (typeof path === 'string') {
            try {
                new URL(path);
                throw Error('no no no');
            } catch {
                return Promise.resolve(this.get(`file://${path}`));
            }
        }
        return Promise.resolve(this.get(path.toString()));
    }

    fakeWriteFileText(path: string | URL, content: string) {
        if (typeof path === 'string') {
            try {
                new URL(path);
                throw Error('no no no');
            } catch {
                return Promise.resolve(this.set(`file://${path}`, content));
            }
        }
        return Promise.resolve(this.set(path.toString(), content));
    }

    fakeFetch(url: string | URL | Request) {
        if (url instanceof URL) {
            return Promise.resolve(new Response(this.get(url.toString())));
        }
        if (url instanceof Request) {
            return Promise.resolve(new Response(this.get(url.url)));
        }
        return Promise.resolve(new Response(this.get(url)));
    }
}

type LightRoot = {
    dependencies: ((LightModule & { entrypoint: URL }) | graph.Module)[];
};

type LightModule = {
    url: URL;
    dependencies?: (LightModule | graph.Module)[];
};

function root(
    ffs: FakeEnvironment,
    rootConfig: LightRoot | graph.Root,
): graph.Root {
    const dependencies = rootConfig.dependencies.map((dependency) => {
        if ('type' in dependency) {
            return dependency;
        }
        return module(ffs, dependency);
    });

    return {
        type: 'root',
        id: 'root',
        hash: dependencies.reduce((hash, module) => {
            return hash.update(module.moduleHash);
        }, new murmur.Hash()).digest(),
        dependencies,
    };
}

function module(
    ffs: FakeEnvironment,
    moduleConfig: (LightModule & { entrypoint: URL }) | graph.Module,
): graph.Module {
    const dependencies = (moduleConfig.dependencies ?? []).map((dependency) => {
        if ('type' in dependency) {
            return dependency;
        }
        return module(ffs, {
            ...dependency,
            entrypoint: moduleConfig.entrypoint,
        });
    });

    const contentHash = ffs.hash(moduleConfig.url.toString());

    const mod: graph.Module = {
        type: 'module',
        id: `${moduleConfig.entrypoint}:${moduleConfig.url}`,
        entrypoint: moduleConfig.entrypoint,
        url: moduleConfig.url,
        moduleHash: dependencies.reduce((hash, node) => {
            return hash.update(node.moduleHash);
        }, new murmur.Hash().update(contentHash)).digest(),
        contentHash,
        dependencies,
    };

    return mod;
}
