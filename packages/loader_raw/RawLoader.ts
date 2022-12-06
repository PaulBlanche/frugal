/**
 * Loader for raw files
 */
import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as log from '../log/mod.ts';

import * as frugal from '../core/mod.ts';

function logger() {
    return log.getLogger('frugal:loader:RawLoader');
}

type Config = {
    test: (url: URL) => boolean;
};

/**
 * Raw Loader, will copy to public dir the file and output a unique url
 */
export class RawLoader implements frugal.Loader<void> {
    name = 'raw';
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

        params.assets.map(async (asset) => {
            return await cache.memoize({
                key: asset.hash,
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

                    const { default: raw } = await import(asset.module);

                    const source = raw.asset;
                    const dest = path.join(params.config.publicDir, raw.url);
                    await fs.ensureDir(path.dirname(dest));

                    await Deno.copyFile(source, dest);

                    return raw.url;
                },
            });
        });

        await cache.save();

        return;
    }
}
