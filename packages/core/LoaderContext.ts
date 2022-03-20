import * as log from '../log/mod.ts';
import { Asset } from './loader.ts';
import { CleanConfig } from './Config.ts';
import { Cache } from './Cache.ts';
import * as path from '../../dep/std/path.ts';

function logger() {
    return log.getLogger('frugal:LoaderContext');
}

const LOADER_CONTEXT_FILENAME = 'LoaderContext.json';

export class LoaderContext {
    private context: { [s: string]: any };
    private config: CleanConfig;

    static async build(
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
                timerStart: 'loader context build',
            },
        });

        const context: { [s: string]: any } = {};

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
                timerEnd: 'loader context build',
            },
        });

        return new LoaderContext(context, config);
    }

    static async load(
        config: CleanConfig,
    ) {
        const context = JSON.parse(
            await Deno.readTextFile(
                path.resolve(config.cacheDir, LOADER_CONTEXT_FILENAME),
            ),
        );

        return new LoaderContext(context, config);
    }

    constructor(context: { [s: string]: any }, config: CleanConfig) {
        this.context = context;
        this.config = config;
    }

    async save() {
        await Deno.writeTextFile(
            path.resolve(this.config.cacheDir, LOADER_CONTEXT_FILENAME),
            JSON.stringify(this.context),
        );
    }

    get<VALUE = any>(name: string): VALUE {
        return this.context[name];
    }
}
