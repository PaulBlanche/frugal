import { CleanConfig, Config } from './Config.ts';
import { LoaderContext } from './LoaderContext.ts';
import { GenerationRequest } from './Page.ts';
import * as log from '../log/mod.ts';
import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import { assert } from '../../dep/std/asserts.ts';
import { DependencyGraph, ModuleList } from './DependencyGraph.ts';
import { FilesystemPersistance } from './Persistance.ts';
import { PersistantCache } from './Cache.ts';
import { Router } from './Router.ts';
import { FrugalError } from './FrugalError.ts';

const PAGE_CACHE_FILENAME = 'pages.json';
const MODULES_FILENAME = 'modules.json';
const LOADER_CONTEXT_FILENAME = 'loader_context.json';

function logger() {
    return log.getLogger('frugal:Frugal');
}

/**
 * A Frugal instance.
 */
export class FrugalInstance {
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
export class FrugalBuilder {
    _watch?: boolean;
    #config: Config;
    #cleanConfig: Promise<CleanConfig> | undefined;

    constructor(config: Config) {
        this._watch = false;
        this.#config = config;
        this.#cleanConfig = undefined;
    }

    /**
     * Create a Frugal instance based on a given config object. This leverages
     * cached information from previous build (some operation might be skiped if
     * nothing has changed since the last build) :
     *
     * - dependency graph build (run each time) to gather the list of loadable
     *   modules
     * - cache loading (run each time)
     * - loader pass on loadable modules (some loader might partially or
     *   entirely skip some tasks based on cached info)
     */
    async create() {
        const config = await this._getCleanConfig();

        builderLogger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'building frugal context',
            },
        });

        const { assets, moduleList, configModule } = await this.#analyse();

        const cache = await PersistantCache.load(
            path.resolve(config.cacheDir, PAGE_CACHE_FILENAME),
            {
                hash: configModule?.moduleHash,
                persistance: config.cachePersistance,
            },
        );

        const loaderContext = await LoaderContext.build(
            config,
            assets,
            (name) => {
                return PersistantCache.load(
                    path.resolve(
                        config.cacheDir,
                        'loader',
                        `${name}.json`,
                    ),
                    {
                        hash: configModule?.moduleHash,
                        persistance: new FilesystemPersistance(),
                    },
                );
            },
        );

        const frugal = new FrugalInstance(
            config,
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
        const config = await this._getCleanConfig();

        builderLogger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'loading frugal context',
            },
        });

        try {
            const moduleList = await ModuleList.load(
                path.resolve(config.cacheDir, MODULES_FILENAME),
            );
            const cache = await PersistantCache.load(
                path.resolve(config.cacheDir, PAGE_CACHE_FILENAME),
                {
                    persistance: config.cachePersistance,
                },
            );
            const loaderContext = await LoaderContext.load(
                path.resolve(config.cacheDir, LOADER_CONTEXT_FILENAME),
            );

            const frugal = new FrugalInstance(
                config,
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
        } catch {
            throw new FrugalError(
                'Could not load the frugal context, some files are missing. You might need to build the frugal context first',
            );
        }
    }

    async #analyse() {
        const config = await this._getCleanConfig();

        const dependencyTree = await DependencyGraph.build(
            config.pages.map((page) => page.self),
            {
                resolve: config.resolve,
            },
        );

        const configWithoutPagesDependencyTree = await DependencyGraph.build([
            config.self,
        ], {
            resolve: config.resolve,
            excludes: config.pages.map((page) => page.self),
        });

        const configModule = configWithoutPagesDependencyTree.moduleList().get(
            config.self,
        );

        assert(configModule !== undefined);

        const assets = dependencyTree.gather(config.loaders);

        return {
            assets,
            moduleList: dependencyTree.moduleList(),
            configModule,
        };
    }

    async _getCleanConfig() {
        if (this.#cleanConfig !== undefined) {
            return await this.#cleanConfig;
        }

        this.#cleanConfig = CleanConfig.load(this.#config, this._watch);
        const cleanConfig = await this.#cleanConfig;
        await log.setup(cleanConfig.loggingConfig);

        if (cleanConfig.watch) {
            builderLogger().warning({
                msg: 'running frugal in dev mode, all pages will be treated as dynamic pages',
            });
        }

        return cleanConfig;
    }
}

export class FrugalWatcher {
    #builder: FrugalBuilder;

    constructor(builder: FrugalBuilder) {
        this.#builder = builder;
        this.#builder._watch = true;
    }

    create() {
        return this.#builder.create();
    }

    async watch(paths: string[]) {
        const config = await this.#builder._getCleanConfig();
        const code =
            `const { config } = await import('file://${config.self.pathname}')
        const { FrugalWatcher, FrugalBuilder } = await import('file://${
                new URL('mod.ts', import.meta.url).pathname
            }')

        const frugal = await new FrugalWatcher(new FrugalBuilder(config)).create();
        await frugal.build();
        `;

        const filePath = path.join(config.cacheDir, 'watch.ts');

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, code);

        const child = Deno.spawnChild(Deno.execPath(), {
            args: [
                'run',
                '--unstable',
                paths.length === 0 ? '--watch' : `--watch=${paths.join(',')}`,
                '--no-check',
                '--allow-all',
                filePath,
            ],
            cwd: path.dirname(config.self.pathname),
        });

        child.stdout.pipeTo(Deno.stdout.writable);
        child.stderr.pipeTo(Deno.stderr.writable);

        await child.status;
    }
}

export async function build(config: Config) {
    const builder = new FrugalBuilder(config);
    const instance = await builder.create();
    return await instance.build();
}
