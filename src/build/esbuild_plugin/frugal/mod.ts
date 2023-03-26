import * as esbuild from '../../../../dep/esbuild.ts';
import * as fs from '../../../../dep/std/fs.ts';

import { Config } from '../../../Config.ts';
import { ContentBuilder } from './ContentBuilder.ts';
import { AssetBuilder } from './AssetBuilder.ts';

export type FrugalOptions = {
    config: Config;
    isExport?: boolean;
};

export function frugal({ config, isExport }: FrugalOptions): esbuild.Plugin {
    return {
        name: 'frugal',
        setup(build) {
            build.onEnd(async (result) => {
                const metafile = result.metafile;
                const errors = result.errors;

                if (errors.length !== 0 || metafile === undefined) {
                    return;
                }

                const assetBuilder = new AssetBuilder(metafile, config);
                const assets = await assetBuilder.build();

                try {
                    const builder = new ContentBuilder(metafile, config);
                    const pages = await builder.build(assets, isExport);

                    const contextURL = new URL(
                        'context.json',
                        config.runtimedir,
                    );
                    await fs.ensureFile(contextURL);
                    await Deno.writeTextFile(
                        contextURL,
                        JSON.stringify({ assets, pages }),
                    );
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            });
        },
    };
}
