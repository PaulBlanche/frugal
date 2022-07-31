import * as esbuild from '../../dep/esbuild.ts';
import * as frugal from '../core/mod.ts';
import * as murmur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';

import { bundle, BundleConfig } from './bundle.ts';

function logger() {
    return log.getLogger('frugal:loader:script');
}

type PublicBundleConfig = Omit<
    BundleConfig,
    'cacheDir' | 'publicDir' | 'rootDir' | 'facades'
>;

type Config = {
    bundles: {
        test: (url: URL | string) => boolean;
        name: string;
    }[];
} & PublicBundleConfig;

export type Generated = Record<string, Record<string, string>>;

/**
 * Script loader, able to output bundles from all script modules in the pages
 * dependency graph
 */
export class ScriptLoader implements frugal.Loader<Generated> {
    name = 'script';
    #bundles: Config['bundles'];
    #bundleConfig: PublicBundleConfig;

    constructor({ bundles, ...bundleConfig }: Config) {
        this.#bundleConfig = bundleConfig;
        this.#bundles = bundles;
    }

    /**
     * A function checking if a given url should be handled by this loader.
     *
     * A module in the dependency graph must be handled by this loader if it
     * matches the rule for any of the defined bundles.
     */
    test(url: URL) {
        return this.#bundles.some((bundle) => bundle.test(url));
    }

    /**
     * A function called after all loader are done generating.
     *
     * Since esbuild run as a background service and is not able to stop when deno stops, we must manually stop the background service before exiting deno.
     */
    onBuildContextEnd() {
        esbuild.stop();
    }

    async generate(params: frugal.GenerateParams) {
        logger().debug({
            msg: 'generate',
        });

        const cache = await params.getCache();

        const result = await cache.memoize({
            key: bundleHash(params.assets),
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

                const result = await this.#produce(params);

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

    /**
     * Actual generation of the bundles
     */
    async #produce({ assets, config }: frugal.GenerateParams) {
        const scriptLists = assets.reduce(
            (scriptLists, asset) => {
                const entrypoint = asset.entrypoint;
                const bundle = this.#getFacadeBundle(asset);
                assert(bundle !== undefined);
                scriptLists[entrypoint] = scriptLists[entrypoint] ?? {};
                const entrypointHolder = scriptLists[entrypoint];
                entrypointHolder[bundle] = entrypointHolder[bundle] ?? [];
                entrypointHolder[bundle].push(asset.module);
                return scriptLists;
            },
            {} as { [s: string]: { [s: string]: string[] } },
        );

        const facades = Object.entries(scriptLists).reduce(
            (facades, [entrypoint, bundles]) => {
                for (const bundle in bundles) {
                    facades.push({
                        entrypoint,
                        bundle,
                        content: facadeContent(bundles[bundle]),
                    });
                }

                return facades;
            },
            [] as { entrypoint: string; bundle: string; content: string }[],
        );

        return await bundle({
            ...this.#bundleConfig,
            importMapURL: config.importMapURL,
            publicDir: config.publicDir,
            cacheDir: config.cacheDir,
            facades,
        });
    }

    #getFacadeBundle(asset: frugal.Asset): string | undefined {
        const bundle = this.#bundles.find((bundle) =>
            bundle.test(asset.module)
        );
        return bundle?.name;
    }
}

function bundleHash(assets: frugal.Asset[]) {
    return assets.reduce((hash, asset) => {
        return hash.update(asset.hash);
    }, new murmur.Hash()).digest();
}

function facadeContent(bundle: string[]) {
    const content = bundle.map((path, i) => {
        const name = `import${i}`;
        return `import { main as ${name} } from "${path}";
${name}();`;
    }).join('\n');

    return content;
}
