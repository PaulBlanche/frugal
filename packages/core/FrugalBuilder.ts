import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import { assert } from '../../dep/std/asserts.ts';

import * as log from '../log/mod.ts';

import { CleanConfig, Config } from './Config.ts';
import { LoaderContext } from './LoaderContext.ts';
import { DependencyGraph, ModuleList } from './DependencyGraph.ts';
import { FilesystemPersistance } from './Persistance.ts';
import { PersistantCache } from './Cache.ts';
import { FrugalError } from './FrugalError.ts';
import { Frugal } from './Frugal.ts';
import * as FILENAMES from './filenames.ts';

function logger() {
    return log.getLogger('frugal:FrugalBuilder');
}

/**
 * Convenience function building a FrugalBuilder, a FrugalInsance, and starting
 * the build process.
 */
export async function build(config: Config) {
    const builder = new FrugalBuilder(config);
    const instance = await builder.create();
    return await instance.build();
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

        logger().info({
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
            path.resolve(config.cacheDir, FILENAMES.PAGE_CACHE_FILENAME),
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

        const frugal = new Frugal(
            config,
            moduleList,
            cache,
            loaderContext,
        );

        logger().info({
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

        logger().info({
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
                path.resolve(config.cacheDir, FILENAMES.MODULES_FILENAME),
            );
            const cache = await PersistantCache.load(
                path.resolve(config.cacheDir, FILENAMES.PAGE_CACHE_FILENAME),
                {
                    persistance: config.cachePersistance,
                },
            );
            const loaderContext = await LoaderContext.load(
                path.resolve(
                    config.cacheDir,
                    FILENAMES.LOADER_CONTEXT_FILENAME,
                ),
            );

            const frugal = new Frugal(
                config,
                moduleList,
                cache,
                loaderContext,
            );

            logger().info({
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

        if (config.watch) {
            const injectedScriptPath = path.join(
                config.cacheDir,
                'watch',
                'livereload.injected-watch-script.ts',
            );
            await fs.ensureFile(injectedScriptPath);
            await Deno.writeTextFile(
                injectedScriptPath,
                `import { LiveReloadClient } from "${
                    new URL(
                        '../server/watch/LiveReloadClient.ts',
                        import.meta.url,
                    ).pathname
                }";

export function main() {
    new LiveReloadClient(\`\${location.protocol}//\${location.hostname}:4075/\`);
}
`,
            );

            for (const page of config.pages) {
                assets.push({
                    hash: 'livereload-injected-watch-script',
                    loader: 'inject-watch-script',
                    entrypoint: page.self.href,
                    module: injectedScriptPath,
                });
            }
        }

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
            logger().warning({
                msg: 'running frugal in dev mode, all pages will be treated as dynamic pages',
            });
        }

        return cleanConfig;
    }
}
