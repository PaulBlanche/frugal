import { denoLoaderPlugin } from "../../dep/esbuild_deno_loader.ts";
import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";
import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";

type StyleOptions = {
    filter: RegExp;
};

export function css(
    { filter = /\.css$/ }: Partial<StyleOptions> = {},
): Plugin {
    return (frugal) => {
        const loader = denoLoaderPlugin({
            importMapURL: frugal.config.importMapURL?.href,
            nodeModulesDir: true,
            loader: "portable",
        });

        return {
            name: "frugal:css",
            setup(build) {
                const cssLoader = build.initialOptions.loader?.[".css"] ?? "css";

                loader.setup({
                    ...build,
                    onResolve(options, onResolve) {
                        build.onResolve({ ...options, filter }, async (args) => {
                            return await onResolve(args);
                        });
                    },
                    onLoad(options, onLoad) {
                        build.onLoad({ ...options, filter }, async (args) => {
                            log(
                                `found css module "${args.path}"`,
                                { scope: "frugal:css", level: "debug" },
                            );

                            // try denoloaderplugin first to load npm files.
                            // files and http will throw because of the `.css`
                            // extension. Those will be loaded with
                            // `frugal.load`
                            try {
                                const loaded = await onLoad(args);
                                return { ...loaded, loader: cssLoader };
                            } catch {
                                const url = frugal.url(args);
                                const contents = await frugal.load(url);
                                return { contents, loader: cssLoader };
                            }
                        });
                    },
                });

                build.onEnd(async (result) => {
                    const metafile = result.metafile;
                    const errors = result.errors;

                    if (metafile === undefined || errors.length !== 0) {
                        return;
                    }

                    await Promise.all(
                        Object.keys(metafile.outputs).map(async (outputPath) => {
                            if (outputPath.match(filter)) {
                                const basename = path.basename(outputPath);
                                const dest = new URL(`css/${basename}`, frugal.config.publicdir);
                                await fs.ensureFile(dest);
                                await fs.copy(new URL(outputPath, frugal.config.rootdir), dest, { overwrite: true });
                                frugal.output("style", dest);
                            }
                        }),
                    );
                });
            },
        };
    };
}
