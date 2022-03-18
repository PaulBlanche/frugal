import { Asset, PageContext } from './loader.ts';
import * as graph from '../dependency_graph/mod.ts';
import * as path from '../../dep/std/path.ts';
import { Page } from './Page.ts';
import { Cache } from './Cache.ts';
import { CleanConfig } from './Config.ts';
import * as asset from './asset.ts';
import { assert } from '../assert/mod.ts';
import * as log from '../log/mod.ts';

function logger() {
    return log.getLogger('frugal:FrugalContext');
}

const CACHE_FILENAME = 'cache.json';
const PAGE_CONTEXT_FILENAME = 'pageContext.json';
const DEPENDENCY_TREE_FILENAME = 'dependencyTree.json';

export class FrugalContext {
    private config: CleanConfig;
    readonly pageContext: PageContext;
    readonly pages: Page<any, any>[];
    readonly cache: Cache;
    readonly dependencyTree: graph.DependencyTree;

    static async build(config: CleanConfig) {
        const cache = await Cache.load(
            path.resolve(config.cacheDir, CACHE_FILENAME),
        );
        const resolvedPages = resolvePages(config);
        const { pageContext, dependencyTree } = await buildContext(
            config,
            cache,
            resolvedPages,
        );
        const pages = await loadPages(resolvedPages, dependencyTree);

        return new FrugalContext(
            config,
            pageContext,
            dependencyTree,
            pages,
            cache,
        );
    }

    static async load(config: CleanConfig) {
        //TODO check that files are there
        const cache = await Cache.load(
            path.resolve(config.cacheDir, CACHE_FILENAME),
        );
        const resolvedPages = resolvePages(config);
        const { pageContext, dependencyTree } = await loadContext(config);
        const pages = await loadPages(resolvedPages, dependencyTree);

        return new FrugalContext(
            config,
            pageContext,
            dependencyTree,
            pages,
            cache,
        );
    }

    constructor(
        config: CleanConfig,
        pageContext: PageContext,
        dependencyTree: graph.DependencyTree,
        pages: Page<any, any>[],
        cache: Cache,
    ) {
        this.config = config;
        this.dependencyTree = dependencyTree;
        this.pageContext = pageContext;
        this.pages = pages;
        this.cache = cache;
    }

    async save() {
        await this.cache.save(
            path.resolve(this.config.cacheDir, CACHE_FILENAME),
        );
        await this.savePageContext();
        await this.saveDependencyTree();
    }

    private async savePageContext() {
        await Deno.writeTextFile(
            path.resolve(this.config.cacheDir, PAGE_CONTEXT_FILENAME),
            JSON.stringify(this.pageContext),
        );
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

function resolvePages(config: CleanConfig) {
    return config.pages.map((pagePath) =>
        new URL(pagePath, `file:///${config.root}/`)
    );
}

export async function buildContext(
    config: CleanConfig,
    cache: Cache,
    resolvedPages: URL[],
) {
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
        resolvedPages,
        {
            resolve: config.resolve,
        },
    );

    const assets = asset.gather(dependencyTree, config.loaders);

    const pageContext = await buildPageContext(config, assets, cache);

    logger().info({
        op: 'done',
        msg() {
            return `${this.logger!.timerEnd} ${this.op}`;
        },
        logger: {
            timerEnd: 'context build',
        },
    });

    return { pageContext, dependencyTree };
}

async function loadPages(
    resolvedPages: URL[],
    dependencyTree: graph.DependencyTree,
) {
    return await Promise.all(resolvedPages.map(async (resolvedPage) => {
        const node = dependencyTree.dependencies.find((node) =>
            node.url.toString() === resolvedPage.toString()
        );
        assert(node !== undefined);

        return await Page.load(
            String(node.url),
            node.moduleHash,
        );
    }));
}

async function buildPageContext(
    config: CleanConfig,
    assets: Asset[],
    cache: Cache,
) {
    logger().info({
        op: 'start',
        msg() {
            return `${this.op} ${this.logger!.timerStart}`;
        },
        logger: {
            timerStart: 'page context build',
        },
    });

    const context: PageContext = {};

    await Promise.all((config.loaders ?? []).map(async (loader) => {
        const loaderCache = cache.getNamespace(loader.name);

        const loadedAssets = assets.filter((entry) =>
            entry.loader === loader.name
        );

        if (loadedAssets === undefined || loadedAssets.length === 0) {
            return;
        }

        const result = await loader.generate({
            cache: loaderCache,
            assets: loadedAssets,
            dir: {
                public: config.publicDir,
                cache: config.cacheDir,
                root: config.root,
            },
        });

        context[loader.name] = result;
    }));

    logger().info({
        op: 'done',
        msg() {
            return `${this.logger!.timerEnd} ${this.op}`;
        },
        logger: {
            timerEnd: 'page context build',
        },
    });

    return context;
}

async function loadContext(config: CleanConfig) {
    const pageContext = await loadPageContext(config);
    const dependencyTree = await loadDependencyTree(config);

    return { pageContext, dependencyTree };
}

async function loadPageContext(config: CleanConfig): Promise<PageContext> {
    return JSON.parse(
        await Deno.readTextFile(
            path.resolve(config.cacheDir, PAGE_CONTEXT_FILENAME),
        ),
    );
}

async function loadDependencyTree(
    config: CleanConfig,
): Promise<graph.DependencyTree> {
    return JSON.parse(
        await Deno.readTextFile(
            path.resolve(config.cacheDir, DEPENDENCY_TREE_FILENAME),
        ),
    );
}
