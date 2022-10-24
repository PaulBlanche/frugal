import * as log from '../log/mod.ts';
import { Asset } from './loader.ts';
import { CleanConfig } from './Config.ts';
import { PersistantCache } from './Cache.ts';
import * as fs from '../../dep/std/fs.ts';

function logger() {
    return log.getLogger('frugal:LoaderContext');
}

type Context = { [s: string]: unknown };

/**
 * Class holding the result of all loaders generation
 */
export class LoaderContext {
    #context: Context;

    static async build(
        config: CleanConfig,
        assets: Asset[],
        getLoaderCache: (name: string) => Promise<PersistantCache>,
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

        return new LoaderContext(context);
    }

    static async load(
        filePath: string,
    ) {
        const serializedData = await Deno.readTextFile(filePath);
        const context = JSON.parse(serializedData);

        return new LoaderContext(context);
    }

    constructor(context: Context) {
        this.#context = context;
    }

    async save(filePath: string) {
        const serializedData = JSON.stringify(this.#context);

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
    getLoaderCache: (name: string) => Promise<PersistantCache>,
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
