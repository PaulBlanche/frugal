import { PageContext, Asset } from './loader.ts';
import * as graph from '../dependency_graph/mod.ts';
import { Page } from './Page.ts'
import { Cache } from './Cache.ts'
import { CleanConfig } from './Config.ts'
import * as asset from './asset.ts';
import { assert } from '../assert/mod.ts';
import * as log from '../log/mod.ts';

function logger() {
    return log.getLogger('frugal:FrugalContext');
}

export type FrugalContext = {
    pageContext: PageContext
    dependencyTree: graph.DependencyTree
    pages: Page<any, any>[]
    cache: Cache
}

export async function loadContext(config: CleanConfig): Promise<FrugalContext> {
    const cache = await Cache.load(config.cachePath);
        
    const resolvedPages = config.pages.map((pagePath) =>
        new URL(pagePath, `file:///${config.root}/`)
    );

    const dependencyTree = await graph.build(
        resolvedPages,
        {
            resolve: config.resolve
        },
    );

    const assets = asset.gather(dependencyTree, config.loaders);

    const pageContext = await loadPageContext(config, assets, cache);

    const pages = await Promise.all(resolvedPages.map(async (resolvedPage) => {
        const node = dependencyTree.dependencies.find((node) =>
            node.url.toString() === resolvedPage.toString()
        );
        assert(node !== undefined);

        return await Page.load(
            String(node.url), 
            node.moduleHash
        );
    }));

    return { dependencyTree, pageContext, pages, cache }
}

async function loadPageContext(config: CleanConfig, assets: Asset[], cache: Cache) {
    const context: PageContext = {};

    logger().info({
        msg: 'build entrypoint contexts',
    });

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

    return context;    
}

