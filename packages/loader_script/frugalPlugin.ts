import * as esbuildDenoLoader from '../../dep/esbuild_deno_loader.ts';
import * as esbuild from '../../dep/esbuild.ts';

export type Transformer = {
    test: (url: string) => boolean;
    transform: (
        url: string,
        contents: string | Uint8Array,
    ) => Promise<string> | string;
};

type FrugalPluginOptions = esbuildDenoLoader.DenoPluginOptions & {
    transformers?: Transformer[];
};

/**
 * Wrap denoPlugin (used to resolve file using deno rules), to allow running
 * transformers on the loaded code.
 *
 * These transformers allow for simple transformation, like replacing in a style
 * module each rules with the generated classname. They are no meant for complex
 * transformation.
 */
export function frugalPlugin(options: FrugalPluginOptions): esbuild.Plugin {
    const plugin = esbuildDenoLoader.denoPlugin(options);

    return {
        name: 'frugal',
        setup(build) {
            return plugin.setup({
                ...build,
                onLoad(onLoadOptions, onLoadCallback) {
                    hijackOnLoad(build, onLoadOptions, onLoadCallback);
                },
            });
        },
    };

    function hijackOnLoad(
        build: esbuild.PluginBuild,
        onLoadOptions: esbuild.OnLoadOptions,
        onLoadCallback: (
            args: esbuild.OnLoadArgs,
        ) =>
            | esbuild.OnLoadResult
            | Promise<esbuild.OnLoadResult | null | undefined>
            | null
            | undefined,
    ) {
        build.onLoad(onLoadOptions, async (args) => {
            const content = await onLoadCallback(args);

            if (options.transformers === undefined) {
                return content;
            }

            for (const { test, transform } of options.transformers) {
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
    }
}
