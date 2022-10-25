import * as swc from '../../packages/swc-wasm/mod.ts';
import * as murmur from '../murmur/mod.ts';
import { assert } from '../../dep/std/asserts.ts';

import * as visitor from './visitor.ts';
import * as log from '../log/mod.ts';
import * as graph from './graph.ts';
import * as path from '../../dep/std/path.ts';

type Precursor = {
    type: 'precursor';
    url: URL;
    loader?: string;
    parent?: graph.Module;
};

type Entry = Precursor | graph.Module;

export type Config = {
    excludes?: URL[];
    load?: (
        resolvedModuleSpecifier: URL,
    ) => Promise<string | undefined> | undefined;
    resolve?: (specifier: string, referrer: URL) => URL | undefined;
};

export type DependencyGraph = graph.Root;
export type Node = graph.Module;

/**
 * Build a dependency graph from the given entrypoints.
 */
export async function build(
    entrypoints: URL[],
    config: Config = {},
): Promise<DependencyGraph> {
    const analysisCache = new Map<string, Promise<AnalysisResult>>();

    logger().info({
        op: 'start',
        msg() {
            return `${this.op} ${this.logger!.timerStart}`;
        },
        logger: {
            timerStart: 'dependency graph',
        },
    });

    const dependencies = await Promise.all(
        entrypoints.map((entrypoint) => buildForEntrypoint(entrypoint)),
    );

    logger().info({
        op: 'done',
        msg() {
            return `${this.logger!.timerEnd} ${this.op}`;
        },
        logger: {
            timerEnd: 'dependency graph',
        },
    });

    return {
        type: 'root',
        id: 'root',
        hash: dependencies.reduce((hash, dependency) => {
            return hash.update(dependency.moduleHash);
        }, new murmur.Hash()).digest(),
        dependencies,
    };

    /**
     * Build the dependency graph for one entrypoint.
     *
     * On each descovered module, we also compute a module hash of the content
     * hash of the module, and the module hash of each dependencies. This hash
     * changes if the code of the module or any of its dependencies changes.
     */
    async function buildForEntrypoint(resolvedEntrypoint: URL) {
        const cache = new Map<string, graph.Module>();

        let root: graph.Module | undefined = undefined;

        const queue: Entry[] = [{ type: 'precursor', url: resolvedEntrypoint }];
        let current: Entry | undefined;
        while ((current = queue.pop()) !== undefined) {
            if (current.type === 'precursor') {
                const module = await getModule(resolvedEntrypoint, current);

                if (current.parent !== undefined) {
                    const parentAlreadyHasThisDependency = current.parent
                        .dependencies
                        .some(
                            (dependency) =>
                                dependency.url.toString() ===
                                    module.url.toString(),
                        );
                    if (!parentAlreadyHasThisDependency) {
                        current.parent.dependencies.push(module);
                    }
                }

                if (current.parent === undefined) {
                    root = module;
                }
            } else {
                current.moduleHash = current.dependencies.reduce(
                    (hash, dependency) => {
                        return hash.update(dependency.moduleHash);
                    },
                    new murmur.Hash().update(current.moduleHash),
                ).digest();
            }
        }

        assert(root !== undefined);

        return root;

        /**
         * Return a memoized module objet. If the precursor url was already
         * visited for the current entrypoint, this method return the cached
         * module
         */
        async function getModule(
            resolvedEntrypoint: URL,
            precursor: Precursor,
        ): Promise<graph.Module> {
            const id = `${resolvedEntrypoint}:${precursor.url}`;
            const { module, dependencies } = await generateModule(
                resolvedEntrypoint,
                precursor,
            );
            const cachedModule = cache.get(id);

            if (cachedModule !== undefined) {
                assert(
                    module.loader === cachedModule.loader,
                    `The module ${precursor.url} can't be loaded with two different loaders (${module.loader} and ${cachedModule.loader})`,
                );
                return cachedModule;
            }

            queue.push(module);

            [...dependencies].reverse().forEach((dependency) => {
                if (!excluded(dependency.url)) {
                    queue.push({
                        type: 'precursor',
                        url: dependency.url,
                        loader: dependency.loader,
                        parent: module,
                    });
                }
            });

            cache.set(id, module);
            return module;
        }

        /**
         * Return a module object form an analysis of the module.
         */
        async function generateModule(
            resolvedEntrypoint: URL,
            precursor: Precursor,
        ): Promise<
            {
                module: graph.Module;
                dependencies: { url: URL; loader?: string }[];
            }
        > {
            const { dependencies, contentHash } = await analyzeMemoized(
                precursor.url,
            );

            const module: graph.Module = {
                type: 'module',
                id: `${resolvedEntrypoint}:${precursor.url}`,
                entrypoint: resolvedEntrypoint,
                url: precursor.url,
                loader: precursor.loader,
                moduleHash: contentHash,
                contentHash,
                dependencies: [],
            };

            return { module, dependencies };
        }
    }

    /**
     * Return a memoized analysis of a given module
     */
    async function analyzeMemoized(
        resolvedModuleSpecifier: URL,
    ): Promise<AnalysisResult> {
        const key = resolvedModuleSpecifier.toString();
        if (!analysisCache.has(key)) {
            analysisCache.set(key, analyze(resolvedModuleSpecifier, config));
        }

        const analysisResult = await analysisCache.get(key);
        assert(analysisResult !== undefined);

        return analysisResult;
    }

    function excluded(url: URL) {
        if (config.excludes === undefined) {
            return false;
        }

        return config.excludes.some((exclude) => exclude.href === url.href);
    }
}

type AnalysisResult = {
    dependencies: { url: URL; loader?: string }[];
    contentHash: string;
};

/**
 * Return an analysis of a given module.
 *
 * We extract all imports :
 * - import declarations : `import foo from 'bar'`, `import { foo } from 'bar'`,
 *   ...
 * - named export declarations : `export { foo as bar } from 'bar'`
 * - export all declarations : `export * as foo from 'bar'`
 *
 * We also compute a content hash of the source code of the module. This hash
 * changes if the source code of the module change.
 */
async function analyze(
    resolvedModuleSpecifier: URL,
    config: Config,
): Promise<AnalysisResult> {
    const dependencies: { url: URL; loader?: string }[] = [];

    logger().debug({
        op: 'analysing',
        path: resolvedModuleSpecifier,
        msg() {
            return `${this.op} ${this.path}`;
        },
    });

    const source = await loadSource(resolvedModuleSpecifier, config.load);
    const contentHash = new murmur.Hash().update(source).digest();

    if (!/\.[tj]sx?/.test(path.extname(resolvedModuleSpecifier.pathname))) {
        return { contentHash, dependencies };
    }

    const ast = swc.parseSync(source, {
        target: 'es2022',
        syntax: 'typescript',
        tsx: true,
        comments: false,
    });

    visitor.visit<swc.Node>(ast, {
        visitImportDeclaration(node) {
            const importDeclaration = node as swc.ImportDeclaration & {
                typeOnly: boolean;
            };
            if (!importDeclaration.typeOnly) {
                handleImport(
                    importDeclaration.source.value,
                    importDeclaration.asserts,
                );
            }
        },
        visitExportNamedDeclaration(node) {
            const exportDeclaration = node as swc.ExportNamedDeclaration & {
                typeOnly: boolean;
            };
            const identifier = exportDeclaration.source?.value;
            if (identifier !== undefined && !exportDeclaration.typeOnly) {
                handleImport(identifier, exportDeclaration.asserts);
            }
        },
        visitExportAllDeclaration(node) {
            const exportDeclaration = node as swc.ExportAllDeclaration & {
                typeOnly: boolean;
            };
            const identifier = exportDeclaration.source.value;
            if (identifier !== undefined && !exportDeclaration.typeOnly) {
                handleImport(identifier, exportDeclaration.asserts);
            }
        },
    });

    //dependencies.sort((a, b) => a.url.href.localeCompare(b.url.href));

    return { dependencies, contentHash };

    function handleImport(specifier: string, assert?: swc.ObjectExpression) {
        const resolvedDependency = resolveModule(
            specifier,
            resolvedModuleSpecifier,
            config.resolve,
        );

        dependencies.push({
            url: resolvedDependency,
            loader: getLoaderFromImportAssert(assert),
        });
    }
}

function getLoaderFromImportAssert(
    assert?: swc.ObjectExpression,
): string | undefined {
    for (const property of (assert?.properties ?? [])) {
        if (property.type === 'KeyValueProperty') {
            if (
                property.key.type === 'Identifier' &&
                property.key.value === 'loader'
            ) {
                if (property.value.type === 'StringLiteral') {
                    return property.value.value;
                }
            }
        }
    }
}

async function loadSource(resolvedModuleSpecifier: URL, load: Config['load']) {
    if (load !== undefined) {
        const source = await load(resolvedModuleSpecifier);
        if (source !== undefined) {
            return source;
        }
    }
    return baseLoad(resolvedModuleSpecifier);
}

async function baseLoad(resolvedModuleSpecifier: URL): Promise<string> {
    if (resolvedModuleSpecifier.protocol.startsWith('http')) {
        return `//${resolvedModuleSpecifier}`;
    }

    return await Deno.readTextFile(resolvedModuleSpecifier);
}

function resolveModule(
    specifier: string,
    referrer: URL,
    resolve: Config['resolve'],
) {
    if (resolve !== undefined) {
        const resolvedModuleSpecifier = resolve(specifier, referrer);
        if (resolvedModuleSpecifier !== undefined) {
            return resolvedModuleSpecifier;
        }
    }
    return baseResolve(specifier, referrer);
}

function baseResolve(specifier: string, referrer: URL): URL {
    return new URL(specifier, referrer);
}

function logger() {
    return log.getLogger('frugal:dependency_graph');
}
