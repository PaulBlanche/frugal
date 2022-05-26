/**
 * Loader for style modules
 */
import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as log from '../log/mod.ts';

import * as murmur from '../murmur/mod.ts';
import * as frugal from '../core/mod.ts';

function logger() {
    return log.getLogger('frugal:loader:style');
}

type Config = {
    test: (url: URL) => boolean;
    transform?: (bundle: string) => string;
};

/**
 * Style loader, able to output a css stylesheet from all style module in the
 * pages dependency graph
 */
export class StyleLoader implements frugal.Loader<string> {
    name = 'style';
    #config: Config;

    constructor(config: Config) {
        this.#config = config;
    }

    get test() {
        return this.#config.test;
    }

    /**
     * Given a list of assets, generate the css stylesheet in `[public]/style/`.
     * The loader will do nothing if the list of assets as not changed since the
     * last generation
     */
    async generate(params: frugal.GenerateParams) {
        logger().debug({
            msg: 'generate',
        });

        const cache = await params.getCache();

        console.log('#########################################');
        console.log(bundleHash(params.assets), cache.toJSON());
        console.log('#########################################');

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

                const bundleUrl = await this.#produce(params);

                logger().debug({
                    op: 'done',
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `real generation`,
                    },
                });

                return bundleUrl;
            },
            otherwise: () => {
                logger().debug({
                    msg: 'nothing new to generate',
                });
            },
        });

        await cache.save();

        console.log('#########################################');
        console.log(cache.toJSON());
        console.log(await result);
        console.log('#########################################');

        return result;
    }

    /**
     * Real generation of the stylesheet (without cache logic)
     */
    async #produce({ assets, config }: frugal.GenerateParams) {
        const styleModule = new URL('./styled.ts', import.meta.url);

        const styleGeneratorScript = `
import * as style from "${styleModule}";
${assets.map(({ module }) => `await import("${module}");`).join('\n')}
export const output = style.output()`;
        const { output } = await importDynamicModule(styleGeneratorScript);

        const bundle = this.#config.transform
            ? this.#config.transform(output)
            : output;

        const bundleHash = new murmur.Hash()
            .update(bundle)
            .digest();

        const bundleName = `style-${bundleHash.toUpperCase()}`;
        const bundleUrl = `/style/${bundleName}.css`;
        const bundlePath = path.join(config.publicDir, bundleUrl);

        logger().debug({
            url: bundleUrl,
            msg() {
                return `output ${this.url}`;
            },
        });

        await fs.ensureDir(path.dirname(bundlePath));
        await Deno.writeTextFile(bundlePath, bundle);

        return bundleUrl;
    }
}

function bundleHash(assets: frugal.Asset[]) {
    return assets.reduce((hash, asset) => {
        return hash.update(asset.hash);
    }, new murmur.Hash()).digest();
}

async function importDynamicModule(code: string) {
    return await import(
        URL.createObjectURL(new Blob([code]))
    );
}
