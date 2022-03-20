import { LoaderContext } from './LoaderContext.ts';
import * as graph from '../dependency_graph/mod.ts';
import * as path from '../../dep/std/path.ts';
import { Page } from './Page.ts';
import { Cache } from './Cache.ts';
import { CleanConfig } from './Config.ts';
import * as asset from './asset.ts';
import * as log from '../log/mod.ts';
import { EntrypointLoader } from './EntrypointLoader.ts';

function logger() {
    return log.getLogger('frugal:FrugalContext');
}

const CACHE_FILENAME = 'cache.json';
const DEPENDENCY_TREE_FILENAME = 'dependencyTree.json';

export class FrugalContextLoader {
    private config: CleanConfig;
    private entrypointLoader: EntrypointLoader;

    constructor(config: CleanConfig, entrypointLoader: EntrypointLoader) {
        this.config = config;
        this.entrypointLoader = entrypointLoader;
    }

    async build() {
        const cache = await Cache.load(
            path.resolve(this.config.cacheDir, CACHE_FILENAME),
        );

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'context build',
            },
        });

        const dependencyTree = await graph.build(
            this.config.entrypoints.map((entrypoint) => entrypoint.url),
            {
                resolve: this.config.resolve,
            },
        );

        const assets = asset.gather(dependencyTree, this.config.loaders);

        const loaderContext = await LoaderContext.build(
            this.config,
            assets,
            cache,
        );

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'context build',
            },
        });

        const pages = await this.entrypointLoader.load(dependencyTree);
        return new FrugalContext(
            this.config,
            loaderContext,
            dependencyTree,
            pages,
            cache,
        );
    }

    async load() {
        const cache = await Cache.load(
            path.resolve(this.config.cacheDir, CACHE_FILENAME),
        );

        const loaderContext = await LoaderContext.load(this.config);
        const dependencyTree = await this.loadDependencyTree(this.config);

        const pages = await this.entrypointLoader.load(dependencyTree);
        return new FrugalContext(
            this.config,
            loaderContext,
            dependencyTree,
            pages,
            cache,
        );
    }

    private async loadDependencyTree(
        config: CleanConfig,
    ): Promise<graph.DependencyTree> {
        return JSON.parse(
            await Deno.readTextFile(
                path.resolve(config.cacheDir, DEPENDENCY_TREE_FILENAME),
            ),
        );
    }
}

export class FrugalContext {
    private config: CleanConfig;
    readonly loaderContext: LoaderContext;
    readonly pages: Page<any, any>[];
    readonly cache: Cache;
    readonly dependencyTree: graph.DependencyTree;

    static async load(config: CleanConfig) {
        const contextLoader = new FrugalContextLoader(
            config,
            new EntrypointLoader(config),
        );
        return await contextLoader.load();
    }

    static async build(config: CleanConfig) {
        const contextLoader = new FrugalContextLoader(
            config,
            new EntrypointLoader(config),
        );
        return await contextLoader.build();
    }

    constructor(
        config: CleanConfig,
        loaderContext: LoaderContext,
        dependencyTree: graph.DependencyTree,
        pages: Page<any, any>[],
        cache: Cache,
    ) {
        this.config = config;
        this.dependencyTree = dependencyTree;
        this.loaderContext = loaderContext;
        this.pages = pages;
        this.cache = cache;
    }

    async save() {
        await this.cache.save(
            path.resolve(this.config.cacheDir, CACHE_FILENAME),
        );
        await this.loaderContext.save();
        await this.saveDependencyTree();
    }

    private async saveDependencyTree() {
        await Deno.writeTextFile(
            path.resolve(this.config.cacheDir, DEPENDENCY_TREE_FILENAME),
            // we only need top level information of dependency tree (entry point modules)
            // so we save only this to avoid having to serialize circular structure
            JSON.stringify({
                ...this.dependencyTree,
                dependencies: this.dependencyTree.dependencies.map(
                    (dependency) => {
                        return {
                            ...dependency,
                            dependencies: [],
                        };
                    },
                ),
            }),
        );
    }
}
