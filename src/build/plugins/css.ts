import { denoLoaderPlugin } from "../../../dep/esbuild_deno_loader.ts";
import * as esbuild from "../../../dep/esbuild.ts";
import * as path from "../../../dep/std/path.ts";
import * as fs from "../../../dep/std/fs.ts";
import { Build } from "../../Plugin.ts";

const FILTER = /\.css$/;

export function css(frugal: Build): esbuild.Plugin {
    const loader = denoLoaderPlugin({
        importMapURL: frugal.config.importMapURL?.href,
        nodeModulesDir: true,
        loader: "portable",
    });

    return {
        name: "__frugal_internal:css",
        setup(build) {
            const cssLoader = build.initialOptions.loader?.[".css"] ?? "css";

            loader.setup({
                ...build,
                onResolve(options, onResolve) {
                    build.onResolve({ ...options, filter: FILTER }, async (args) => {
                        // delegate to denoLoaderPlugin
                        return await onResolve(args);
                    });

                    build.onResolve({ ...options, filter: FILTER, namespace: "virtual" }, async (args) => {
                        // delegate to denoLoaderPlugin
                        return await onResolve({ ...args, namespace: "file" });
                    });
                },

                onLoad(options, onLoad) {
                    build.onLoad({ ...options, filter: FILTER }, async (args) => {
                        // try denoLoaderPlugin first to load npm files.
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

                const cssBundles = [];
                const globalCssBundles = [];
                for (const outputPath of Object.keys(metafile.outputs)) {
                    const output = metafile.outputs[outputPath];
                    const cssBundle = output.cssBundle;
                    const entrypoint = output.entryPoint;
                    if (entrypoint) {
                        if (cssBundle) {
                            cssBundles.push({ cssBundle, entrypoint });
                        } else if (entrypoint.endsWith(".css")) {
                            globalCssBundles.push({ cssBundle: outputPath, entrypoint: "global" });
                        }
                    }
                }

                const commonRoot = path.common([...cssBundles, ...globalCssBundles].map(({ cssBundle }) => cssBundle));

                const stylesheets: Record<string, string> = {};
                const globalStylesheets: Record<string, string> = {};

                await Promise.all([
                    ...cssBundles.map(async ({ cssBundle, entrypoint }) => {
                        const cssBundlePath = `css/${path.relative(commonRoot, cssBundle)}`;

                        const cssBundleUrl = path.resolve(frugal.config.publicdir, cssBundlePath);

                        stylesheets[entrypoint] = `/${cssBundlePath}`;
                        await fs.ensureFile(cssBundleUrl);
                        await fs.copy(path.resolve(frugal.config.rootdir, cssBundle), cssBundleUrl, {
                            overwrite: true,
                        });
                    }),
                    ...globalCssBundles.map(async ({ cssBundle, entrypoint }) => {
                        const cssBundlePath = `css/${path.relative(commonRoot, cssBundle)}`;

                        const cssBundleUrl = path.resolve(frugal.config.publicdir, cssBundlePath);

                        globalStylesheets[entrypoint] = `/${cssBundlePath}`;
                        await fs.ensureFile(cssBundleUrl);
                        await fs.copy(path.resolve(frugal.config.rootdir, cssBundle), cssBundleUrl, {
                            overwrite: true,
                        });
                    }),
                ]);

                frugal.output("style", { type: "page", assets: stylesheets });
                const globalStylesheet = globalStylesheets["global"];
                if (globalStylesheet) {
                    frugal.output("style", { type: "global", asset: globalStylesheet });
                }
            });
        },
    };
}
