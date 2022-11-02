import * as log from '../log/mod.ts';
import { Asset } from './loader.ts';
import { CleanConfig } from './Config.ts';
import { PersistentCache } from './Cache.ts';
import * as fs from '../../dep/std/fs.ts';
import { Persistence } from './Persistence.ts';

function logger() {
    return log.getLogger('frugal:LoaderContext');
}

type Context = { [s: string]: unknown };

/**
 * Class holding the result of all loaders generation
 */
export class LoaderContext {
    #context: Context;
    #persistence: Persistence;

    static async build(
        config: CleanConfig,
        assets: Asset[],
        getLoaderCache: (name: string) => Promise<PersistentCache>,
    ) {
        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'loader context build',
            },
        });

        const context = await buildContext(config, assets, getLoaderCache);

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'loader context build',
            },
        });

        return new LoaderContext(context, config.cachePersistence);
    }

    static async load(
        config: CleanConfig,
        filePath: string,
    ) {
        const serializedData = await Deno.readTextFile(filePath);
        const context = JSON.parse(serializedData);

        return new LoaderContext(context, config.cachePersistence);
    }

    constructor(context: Context, persistence: Persistence) {
        this.#context = context;
        this.#persistence = persistence;
    }

    async save(filePath: string) {
        const serializedData = JSON.stringify(this.#context);

        await this.#persistence.set(filePath, serializedData);

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, serializedData);
    }

    /**
     * Get the generation result of a loader
     */
    // deno-lint-ignore no-explicit-any
    get<VALUE = any>(name: string): VALUE {
        return this.#context[name] as VALUE;
    }
}

async function buildContext(
    config: CleanConfig,
    assets: Asset[],
    getLoaderCache: (name: string) => Promise<PersistentCache>,
) {
    const context: Context = {};

    Promise.all(config.loaders.map(async (loader) => {
        if (loader.onBuildContextStart) {
            await loader.onBuildContextStart(config);
        }
    }));

    await Promise.all(config.loaders.map(async (loader) => {
        const loadableAssets = assets.filter((entry) =>
            entry.loader === loader.name
        );

        if (loadableAssets === undefined || loadableAssets.length === 0) {
            return;
        }

        context[loader.name] = await loader.generate({
            getCache: () => getLoaderCache(loader.name),
            assets: loadableAssets,
            config,
        });
    }));

    Promise.all(config.loaders.map(async (loader) => {
        if (loader.onBuildContextEnd) {
            await loader.onBuildContextEnd(config);
        }
    }));

    return context;
}
