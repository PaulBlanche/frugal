import * as esbuild from '../../dep/esbuild.ts';
import * as frugal from '../core/mod.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import { bundle, BundleConfig } from './bundle.ts';

function logger() {
    return log.getLogger('frugal:loader:script');
}

type Config = {
    test: (url: URL) => boolean;
    name: string;
    order?(modules: string[]): string[];
    end?: () => void;
} & Omit<BundleConfig, 'cacheDir' | 'publicDir' | 'rootDir' | 'facades'>;

export type Generated = Record<string, Record<string, string>>;

export function script(
    { test, name, order, end, ...bundlConfig }: Config,
): frugal.Loader<Record<string, Record<string, string>>> {
    return {
        name: `script_${name}`,
        test: test,
        generate,
        end: () => {
            esbuild.stop();
            if (end) {
                end();
            }
        },
    };

    async function generate({ assets, getCache, dir }: frugal.GenerateParams) {
        logger().debug({
            msg: 'generate',
        });

        const cache = await getCache();

        const bundleHash = assets.reduce((hash, asset) => {
            return hash.update(asset.hash);
        }, new murmur.Hash()).alphabetic();

        const result = await cache.memoize({
            key: bundleHash,
            producer: async () => {
                logger().debug({
                    op: 'start',
                    msg() {
                        return `${this.op} ${this.logger!.timerStart}`;
                    },
                    logger: {
                        timerStart: `real generation`,
                    },
                });

                const scriptLists = assets.reduce<{ [s: string]: string[] }>(
                    (scriptLists, { module, entrypoint }) => {
                        scriptLists[entrypoint] = scriptLists[entrypoint] ?? [];
                        scriptLists[entrypoint].push(module);
                        return scriptLists;
                    },
                    {},
                );

                const facades = Object.entries(scriptLists).reduce<
                    { entrypoint: string; content: string }[]
                >((facades, [entrypoint, modules]) => {
                    const orderedModules = order ? order(modules) : modules;

                    facades.push({
                        entrypoint,
                        content: orderedModules.map((path, i) => {
                            const name = `import${i}`;
                            return `import { main as ${name} } from "${path}";
                            ${name}();`;
                        }).join('\n'),
                    });

                    return facades;
                }, []);

                const result = await bundle({
                    ...bundlConfig,
                    publicDir: dir.public,
                    cacheDir: dir.cache,
                    rootDir: dir.root,
                    facades,
                });

                logger().debug({
                    op: 'done',
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `real generation`,
                    },
                });

                return result;
            },
            otherwise: () => {
                logger().debug({
                    msg: 'nothing new to generate',
                });
            },
        });

        await cache.save();

        return result;
    }
}
