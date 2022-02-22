import { Cache } from './Cache.ts';
import * as path from '../../dep/std/path.ts';
import * as graph from '../dependency_graph/mod.ts';
import * as asset from './asset.ts';
import * as log from '../log/mod.ts';
import { Page } from './Page.ts';
import { Context } from './loader.ts';
import { assert } from '../assert/mod.ts';
import { Asset, Loader } from './loader.ts';
import * as importmap from '../../dep/importmap.ts';

export type Config = {
    root: string;
    importMap?: string;
    loaders?: Loader<any>[];
    outputDir: string;
    pages: string[];
    logging?: log.Config;
};

const DEFAULT_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: {
        'frugal:asset': 'INFO',
        'frugal:cache': 'INFO',
        'frugal:dependency_graph': 'INFO',
        'frugal:generator': 'INFO',
        'frugal:page': 'INFO',
    },
};

function logger() {
    return log.getLogger('frugal:generator');
}

export async function build(config: Config) {
    await log.setup({
        type: config.logging?.type ?? DEFAULT_LOGGER_CONFIG.type,
        loggers: {
            ...DEFAULT_LOGGER_CONFIG.loggers,
            ...config.logging?.loggers,
        },
    });

    logger().info({
        op: 'start',
        msg() {
            return `${this.op} ${this.logger!.timerStart}`;
        },
        logger: {
            timerStart: 'generation',
        },
    });

    const cachePath = path.join(cacheDir(config), 'frugal.json');
    const cache = await Cache.load(cachePath);

    const resolvedPages = config.pages.map((pagePath) =>
        new URL(pagePath, `file:///${config.root}/`)
    );

    const importMapJson = await loadImportMap(config);

    const dependencyTree = await graph.build(
        resolvedPages,
        importMapJson === undefined ? undefined : {
            resolve: (specifier, referer) => {
                return new URL(
                    importmap.resolve(
                        specifier,
                        importMapJson,
                        referer.toString(),
                    ),
                );
            },
        },
    );

    const gathered = asset.gather(dependencyTree, config.loaders ?? []);

    const context = await load(config, gathered, cache);

    await Promise.all(resolvedPages.map(async (resolvedPage) => {
        const node = dependencyTree.dependencies.find((node) =>
            node.url.toString() === resolvedPage.toString()
        );
        assert(node !== undefined);

        const page = await Page.load({
            url: node.url,
            moduleHash: node.moduleHash,
        });

        await page.generate(cache, context, publicDir(config));
    }));

    await cache.save(cachePath);

    logger().info({
        op: 'done',
        msg() {
            return `${this.logger!.timerEnd} ${this.op}`;
        },
        logger: {
            timerEnd: 'generation',
        },
    });
}

async function load(
    config: Config,
    assets: Asset[],
    cache: Cache,
) {
    const context: Context = {};

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
                public: publicDir(config),
                cache: cacheDir(config),
                root: config.root,
            },
        });

        context[loader.name] = result;
    }));

    return context;
}

export function publicDir(config: Config) {
    return path.resolve(config.root, config.outputDir, 'public');
}

export function cacheDir(config: Config) {
    return path.resolve(config.root, config.outputDir, '.cache');
}

async function loadImportMap(
    config: Config,
): Promise<importmap.ImportMap | undefined> {
    if (config.importMap === undefined) {
        return undefined;
    }

    const source = await Deno.readTextFile(
        new URL(config.importMap, `file:///${config.root}/`),
    );
    return JSON.parse(source);
}
