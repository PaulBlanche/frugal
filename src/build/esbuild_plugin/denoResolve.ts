import * as esbuild from '../../../dep/esbuild.ts';

import { Config } from '../../Config.ts';

type DenoResolveOptions = {
    config: Config;
};

export function denoResolve(
    { config }: DenoResolveOptions,
): esbuild.Plugin {
    return {
        name: 'esbuild:denoResolve',
        setup(build) {
            build.onResolve({ filter: /.*/ }, onResolve);

            build.onLoad({ filter: /.*\.json/, namespace: 'file' }, onLoad);
            build.onLoad({ filter: /.*/, namespace: 'http' }, onLoad);
            build.onLoad({ filter: /.*/, namespace: 'https' }, onLoad);
            build.onLoad({ filter: /.*/, namespace: 'data' }, onLoad);

            async function onLoad(args: esbuild.OnLoadArgs) {
                const { loaded } = await config.loader.load(args);
                return loaded;
            }

            async function onResolve(args: esbuild.OnResolveArgs) {
                return await config.loader.resolve(build.resolve, args);
            }
        },
    };
}
