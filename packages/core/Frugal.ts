import { CleanConfig, Config } from './Config.ts';
import { LoaderContext } from './LoaderContext.ts';
import { GenerationRequest } from './Page.ts';
import * as log from '../log/mod.ts';
import * as path from '../../dep/std/path.ts';
import { DependencyGraph, ModuleList } from './DependencyGraph.ts';
import { FilesystemPersistance } from './Persistance.ts';
import { PersistantCache } from './Cache.ts';
import { Router } from './Router.ts';

const PAGE_CACHE_FILENAME = 'pages.json';
const MODULES_FILENAME = 'modules.json';
const LOADER_CONTEXT_FILENAME = 'loader_context.json';

function logger() {
    return log.getLogger('frugal:Frugal');
}

/**
 * A Frugal instance.
 */
export class Frugal {
    /** the formated config of the frugal instance */
    #config: CleanConfig;
    /** the list of all modules in the dependency graph */
    #moduleList: ModuleList;
    /** the instance cache */
    #cache: PersistantCache;
    /** the context containing the result of all loaders */
    #loaderContext: LoaderContext;
    /** a router, used to match a pathname to the Generator, the Builder or the
     * Refresher of a page matching the pathname */
    #router: Router;

    /**
     * Build a frugal instance (see {@link FrugalBuilder#build})
     */
    static async build(config: Config) {
        return await new FrugalBuilder(config).build();
    }

    /**
     * Load a frugal instance (see {@link FrugalBuilder#load})
     */
    static async load(config: Config) {
        return await new FrugalBuilder(config).load();
    }

    constructor(
        config: CleanConfig,
        moduleList: ModuleList,
        cache: PersistantCache,
        loaderContext: LoaderContext,
    ) {
        this.#router = new Router(config, moduleList, cache, loaderContext);
        this.#config = config;
        this.#moduleList = moduleList;
        this.#cache = cache;
        this.#loaderContext = loaderContext;
    }

    get config() {
        return this.#config;
    }

    get routes() {
        return this.#router.routes;
    }

    /**
     * Save the current Frugal instance, so it can be loaded with the
     * {@link Frugal.load} method
     */
    async save(options: { runtime?: boolean } = {}) {
        if (options.runtime !== true) {
            await this.#moduleList.save(
                path.resolve(this.#config.cacheDir, MODULES_FILENAME),
            );
            await this.#loaderContext.save(
                path.resolve(this.#config.cacheDir, LOADER_CONTEXT_FILENAME),
            );
        }
        await this.#cache.save();
    }

    /**
     * Build all the registered static pages.
     *
     * A page might be skipped if nothing has changed since the last build or
     * refresh of the page
     */
    async build() {
        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'build',
            },
        });

        await Promise.all(this.#router.routes.map(async (route) => {
            if (route.type === 'static') {
                await route.builder.buildAll();
            }
        }));
        await this.save();

        logger().info({
            op: 'done',
            msg() {
                return `${this.op} ${this.logger!.timerEnd}`;
            },
            logger: {
                timerEnd: 'build',
            },
        });
    }

    /**
     * Refresh the static page matching the given `pathname` if it exists.
     *
     * Event if the page match, it might be skipped if nothing has changed since
     * the last build or refresh of the page
     */
    async refresh(pathname: string) {
        logger().info({
            op: 'start',
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `refresh of ${pathname}`,
            },
        });

        const route = this.#router.getMatchingRoute(pathname);
        if (route !== undefined && route.type === 'static') {
            const result = await route.refresher.refresh(pathname);
            await this.save({ runtime: true });

            logger().info({
                op: 'done',
                pathname,
                msg() {
                    return `${this.logger!.timerEnd} ${this.op}`;
                },
                logger: {
                    timerEnd: `refresh of ${pathname}`,
                },
            });

            return result;
        } else {
            logger().info({
                pathname,
                msg() {
                    return `no match found for ${this.pathname}`;
                },
                logger: {
                    timerEnd: `refresh of ${pathname}`,
                },
            });
        }
    }

    /**
     * Generate the page (static or dynamic) matching the given `pathname` if it
     * exists.
     *
     * If a page match, the generation will always run, even if nothing has
     * changed since the las build, refresh or generate.
     */
    async generate(request: GenerationRequest<unknown>) {
        logger().info({
            op: 'start',
            request,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `generation of ${requestToString(request)}`,
            },
        });

        const route = this.#router.getMatchingRoute(request.url.pathname);
        if (route !== undefined) {
            const result = await route.generator.generate(request);
            await this.save({ runtime: true });

            logger().info({
                op: 'done',
                request,
                msg() {
                    return `${this.logger!.timerEnd} ${this.op}`;
                },
                logger: {
                    timerEnd: `generation of ${requestToString(request)}`,
                },
            });

            return result;
        } else {
            logger().info({
                request,
                msg() {
                    return `no match found for ${requestToString(request)}`;
                },
                logger: {
                    timerEnd: `generation of ${requestToString(request)}`,
                },
            });
        }
    }

    /**
     * Wipe the `outputDir`.
     *
     * if `justCache` is set to `true`, the `outputDir` is
     * left untouched, and only the cache directory is wiped
     */
    async clean({ justCache = false }: { justCache?: boolean } = {}) {
        if (justCache) {
            await Deno.remove(this.#config.cacheDir, { recursive: true });
        }
        await Deno.remove(this.#config.outputDir, { recursive: true });
    }
}

export function requestToString(request: GenerationRequest<unknown>) {
    return `${request.method} ${request.url}`;
}

function builderLogger() {
    return log.getLogger('frugal:FrugalBuilder');
}

/**
 * FrugalBuilder does everything needed to build or load a Frugal instance. This
 * class orchestrates config loading, dependency graph building, cache loading
 * and loaders.
 */
class FrugalBuilder {
    #config: Config;
    #cleanConfig: Promise<CleanConfig> | undefined;

    constructor(config: Config) {
        this.#config = config;
        this.#cleanConfig = undefined;
    }

    /**
     * Build a Frugal instance based on a given config object. This leverages
     * cached information from previous build (some operation might be skiped if
     * nothing has changed since the last build) :
     *
     * - dependency graph build (run each time) to gather the list of loadable
     *   modules
     * - cache loading (run each time)
     * - loader pass on loadable modules (some loader might partially or
     *   entirely skip some tasks based on cached info)
     */
    async build() {
        const cleanConfig = await this.#getCleanConfig();

        builderLogger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'building frugal context',
            },
        });

        const { assets, moduleList } = await this.#analyse();

        const cache = await PersistantCache.load(
            cleanConfig.cachePersistance,
            path.resolve(cleanConfig.cacheDir, PAGE_CACHE_FILENAME),
        );

        const loaderContext = await LoaderContext.build(
            cleanConfig,
            assets,
            (name) => {
                return PersistantCache.load(
                    new FilesystemPersistance(),
                    path.resolve(
                        cleanConfig.cacheDir,
                        'loader',
                        `${name}.json`,
                    ),
                );
            },
        );

        const frugal = new Frugal(
            cleanConfig,
            moduleList,
            cache,
            loaderContext,
        );

        builderLogger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'building frugal context',
            },
        });

        return frugal;
    }

    /**
     * Load a Frugal instance based on the previous build. Everything is loaded
     * from cache (no loader pass, no dependency graph built).
     *
     * This is usefull in order to run a server needing access to a Frugal
     * instance after a build process. The two process can be separated (a build
     * in CI, an server in the clouds), because all the information needed to
     * setup the Frugal instance was serialized during the build
     */
    async load() {
        const cleanConfig = await this.#getCleanConfig();

        builderLogger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'loading frugal context',
            },
        });

        const moduleList = await ModuleList.load(
            path.resolve(cleanConfig.cacheDir, MODULES_FILENAME),
        );
        const cache = await PersistantCache.load(
            cleanConfig.cachePersistance,
            path.resolve(cleanConfig.cacheDir, PAGE_CACHE_FILENAME),
        );
        const loaderContext = await LoaderContext.load(
            path.resolve(cleanConfig.cacheDir, LOADER_CONTEXT_FILENAME),
        );

        const frugal = new Frugal(
            cleanConfig,
            moduleList,
            cache,
            loaderContext,
        );

        builderLogger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'loading frugal context',
            },
        });

        return frugal;
    }

    async #analyse() {
        const cleanConfig = await this.#getCleanConfig();

        const dependencyTree = await DependencyGraph.build(
            cleanConfig.pages.map((page) => page.self),
            {
                resolve: cleanConfig.resolve,
            },
        );

        const assets = dependencyTree.gather(cleanConfig.loaders);

        return { assets, moduleList: dependencyTree.moduleList() };
    }

    async #getCleanConfig() {
        if (this.#cleanConfig !== undefined) {
            return await this.#cleanConfig;
        }

        const config = await CleanConfig.load(this.#config);
        await log.setup(config.loggingConfig);

        if (config.devMode) {
            builderLogger().warning({
                msg: 'running frugal in dev mode, all pages will be treated as dynamic pages',
            });
        }

        return config;
    }
}
