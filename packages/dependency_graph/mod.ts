import * as swc from '../../dep/swc.ts';
import * as path from '../../dep/std/path.ts';
import * as murmur from '../murmur/mod.ts';
import { assert } from '../assert/mod.ts';

import * as visitor from './visitor.ts';
import * as log from '../log/mod.ts';
import * as tree from './tree.ts';

type Precursor = {
    type: 'precursor';
    url: URL;
    parent?: tree.Module;
};

type Entry = Precursor | tree.Module;

type Config = {
    load?: (
        resolvedModuleSpecifier: URL,
    ) => Promise<string | undefined> | undefined;
    resolve?: (specifier: string, referrer: URL) => URL | undefined;
};

export type DependencyTree = tree.Root;

export async function build(
    entrypoints: URL[],
    config: Config = {},
): Promise<DependencyTree> {
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
        hash: dependencies.reduce((hash, dependency) => {
            return hash.update(dependency.moduleHash);
        }, new murmur.Hash()).alphabetic(),
        dependencies,
    };

    async function buildForEntrypoint(resolvedEntrypoint: URL) {
        const cache = new Map<string, Promise<tree.Module>>();

        let root: tree.Module | undefined = undefined;

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
                ).alphabetic();
            }
        }

        assert(root !== undefined);

        return root;

        async function getModule(
            resolvedEntrypoint: URL,
            precursor: Precursor,
        ): Promise<tree.Module> {
            const key = `${resolvedEntrypoint}:${precursor.url}`;
            if (!cache.has(key)) {
                cache.set(key, generateModule(resolvedEntrypoint, precursor));
            }

            const node = await cache.get(key);
            assert(node !== undefined);

            return node;
        }

        async function generateModule(
            resolvedEntrypoint: URL,
            precursor: Precursor,
        ): Promise<tree.Module> {
            const { dependencies, contentHash } = await analyzeMemoized(
                precursor.url,
            );

            const module: tree.Module = {
                type: 'module',
                entrypoint: resolvedEntrypoint,
                url: precursor.url,
                moduleHash: contentHash,
                contentHash,
                dependencies: [],
            };

            queue.push(module);

            dependencies.reverse().forEach((dependency) => {
                queue.push({
                    type: 'precursor',
                    url: dependency,
                    parent: module,
                });
            });

            return module;
        }
    }

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
}

type AnalysisResult = {
    dependencies: URL[];
    contentHash: string;
};

async function analyze(
    resolvedModuleSpecifier: URL,
    config: Config,
): Promise<AnalysisResult> {
    const dependencies: URL[] = [];

    logger().debug({
        op: 'analysing',
        path: resolvedModuleSpecifier,
        msg() {
            return `${this.op} ${this.path}`;
        },
    });

    const source = await loadSource(resolvedModuleSpecifier, config.load);

    const ast = swc.parse(source, {
        target: 'es2019',
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
                handleImport(importDeclaration.source.value);
            }
        },
        visitExportNamedDeclaration(node) {
            const exportDeclaration = node as swc.ExportNamedDeclaration & {
                typeOnly: boolean;
            };
            const identifier = exportDeclaration.source?.value;
            if (identifier !== undefined && !exportDeclaration.typeOnly) {
                handleImport(identifier);
            }
        },
        visitExportAllDeclaration(node) {
            const exportDeclaration = node as swc.ExportAllDeclaration & {
                typeOnly: boolean;
            };
            const identifier = exportDeclaration.source.value;
            if (identifier !== undefined && !exportDeclaration.typeOnly) {
                handleImport(identifier);
            }
        },
    });

    return {
        dependencies,
        contentHash: new murmur.Hash().update(source).alphabetic(),
    };

    function handleImport(specifier: string) {
        const resolvedDependency = resolveModule(
            specifier,
            resolvedModuleSpecifier,
            config.resolve,
        );

        dependencies.push(resolvedDependency);
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
        //const response = await fetch(resolvedModuleSpecifier);
        //return await response.text();
        console.log(`//${resolvedModuleSpecifier}`);
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
