import {
    denoPlugin,
    DenoPluginOptions,
} from '../../dep/esbuild_deno_loader.ts';
import { Plugin } from '../../dep/esbuild.ts';

export type Transformer = {
    test: (url: string) => boolean;
    transform: (
        url: string,
        contents: string | Uint8Array,
    ) => Promise<string> | string;
};

type FrugalPluginOptions = DenoPluginOptions & {
    transformers?: Transformer[];
};

export function frugalPlugin(options: FrugalPluginOptions): Plugin {
    const plugin = denoPlugin(options);

    return {
        name: 'frugal',
        setup(build) {
            return plugin.setup({
                ...build,
                onLoad(onLoadOptions, onLoadCallback) {
                    build.onLoad(onLoadOptions, async (args) => {
                        const content = await onLoadCallback(args);

                        if (options.transformers === undefined) {
                            return content;
                        }

                        for (
                            const { test, transform } of options.transformers
                        ) {
                            if (content?.contents && test(args.path)) {
                                content.contents = await transform(
                                    args.path,
                                    content.contents,
                                );
                                return content;
                            }
                        }

                        return content;
                    });
                },
            });
        },
    };
}
