import * as esbuild from '../../dep/esbuild.ts';
import * as frugal from '../core/mod.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';

import { bundle, BundleConfig } from './bundle.ts';

function logger() {
    return log.getLogger('frugal:loader:script');
}

type Config = {
    bundles: {
        test: (url: URL | string) => boolean;
        name: string;
    }[];
} & Omit<BundleConfig, 'cacheDir' | 'publicDir' | 'rootDir' | 'facades'>;

export type Generated = Record<string, Record<string, string>>;

export function script(
    { bundles, ...bundlConfig }: Config,
): frugal.Loader<Record<string, Record<string, string>>> {
    return {
        name: `script`,
        test,
        generate,
        end: () => {
            esbuild.stop();
        },
    };

    async function generate({ assets, getCache, dir }: frugal.GenerateParams) {
        logger().debug({
            msg: 'generate',
        });

        const cache = await getCache();

        const bundleHash = assets.reduce((hash, asset) => {
            return hash.update(asset.hash);
        }, new murmur.Hash()).digest();

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

                const scriptLists = assets.reduce<
                    { [s: string]: { [s: string]: string[] } }
                >(
                    (scriptLists, asset) => {
                        const bundle = getBundle(asset);
                        assert(bundle !== undefined);
                        scriptLists[asset.entrypoint] =
                            scriptLists[asset.entrypoint] ?? {};
                        scriptLists[asset.entrypoint][bundle] =
                            scriptLists[asset.entrypoint][bundle] ?? [];
                        scriptLists[asset.entrypoint][bundle].push(
                            asset.module,
                        );
                        return scriptLists;
                    },
                    {},
                );

                const facades = Object.entries(scriptLists).reduce<
                    { entrypoint: string; bundle: string; content: string }[]
                >((facades, [entrypoint, bundles]) => {
                    for (const bundle in bundles) {
                        facades.push({
                            entrypoint,
                            bundle,
                            content: bundles[bundle].map((path, i) => {
                                const name = `import${i}`;
                                return `import { main as ${name} } from "${path}";
                                ${name}();`;
                            }).join('\n'),
                        });
                    }

                    return facades;
                }, []);

                const result = await bundle({
                    ...bundlConfig,
                    publicDir: dir.public,
                    cacheDir: dir.cache,
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

    function test(url: URL) {
        return bundles.some((bundle) => bundle.test(url));
    }

    function getBundle(asset: frugal.Asset): string | undefined {
        const bundle = bundles.find((bundle) => bundle.test(asset.module));
        return bundle?.name;
    }
}
