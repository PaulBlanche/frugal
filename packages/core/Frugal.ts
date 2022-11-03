import * as path from '../../dep/std/path.ts';

import * as log from '../log/mod.ts';

import { CleanConfig } from './Config.ts';
import { LoaderContext } from './LoaderContext.ts';
import { ModuleList } from './DependencyGraph.ts';
import { PersistentCache } from './Cache.ts';
import { Router } from './Router.ts';
import * as FILENAMES from './filenames.ts';
import { PageDescriptorError } from './Page.ts';

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
    #cache: PersistentCache;
    /** the context containing the result of all loaders */
    #loaderContext: LoaderContext;
    /** a router, used to match a pathname to the Generator, the Builder or the
     * Refresher of a page matching the pathname */
    #router: Router;

    constructor(
        config: CleanConfig,
        moduleList: ModuleList,
        cache: PersistentCache,
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

    getMatchingRoute(pathname: string) {
        return this.#router.getMatchingRoute(pathname);
    }

    /**
     * Save the current Frugal instance, so it can be loaded with the
     * {@link Frugal.load} method
     */
    async save(options: { runtime?: boolean } = {}) {
        if (options.runtime !== true) {
            await this.#moduleList.save(
                path.resolve(this.#config.cacheDir, FILENAMES.MODULES_FILENAME),
            );
            await this.#loaderContext.save(
                path.resolve(
                    this.#config.cacheDir,
                    FILENAMES.LOADER_CONTEXT_FILENAME,
                ),
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

        try {
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
        } catch (error: unknown) {
            if (error instanceof PageDescriptorError) {
                logger().error({
                    self: error.page.self,
                    error: error.message,
                    msg() {
                        return `Error on page descriptor ${this.self}: ${this.error}`;
                    },
                });
            }
            throw error;
        }
    }

    /**
     * Wipe the `outputDir`.
     *
     * if `justCache` is set to `true`, the `outputDir` is
     * left untouched, and only the cache directory is wiped
     */
    async clean({ justCache = false }: { justCache?: boolean } = {}) {
        try {
            if (justCache) {
                await Deno.remove(this.#config.cacheDir, { recursive: true });
            }
            await Deno.remove(this.#config.outputDir, { recursive: true });
        } catch (error: unknown) {
            if (error instanceof Deno.errors.NotFound) {
                return;
            }
            throw error;
        }
    }
}
