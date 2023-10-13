import * as esbuild from "../../../dependencies/esbuild.js";
import * as path from "../../../dependencies/path.js";
import * as fs from "../../../dependencies/fs.js";

import * as context from "../../Plugin.js";

/**
 * @param {context.Context} context
 * @returns {esbuild.Plugin}
 */
export function css(context) {
    return {
        name: "frugal-internal:css",
        setup(build) {
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

                const commonRoot = path.common(
                    [...cssBundles, ...globalCssBundles].map(({ cssBundle }) => cssBundle),
                );

                /** @type {Record<string, string>} */
                const stylesheets = {};
                /** @type {Record<string, string>} */
                const globalStylesheets = {};

                await Promise.all(
                    [...cssBundles, ...globalCssBundles].map(async ({ cssBundle, entrypoint }) => {
                        const cssBundlePath = `css/${path.relative(commonRoot, cssBundle)}`;

                        const cssBundleAbsolutePath = path.resolve(
                            context.config.publicdir,
                            cssBundlePath,
                        );

                        stylesheets[entrypoint] = `/${cssBundlePath}`;
                        await fs.ensureFile(cssBundleAbsolutePath);
                        await fs.copy(
                            path.resolve(context.config.rootdir, cssBundle),
                            cssBundleAbsolutePath,
                            {
                                overwrite: true,
                            },
                        );
                    }),
                );

                context.output("style", { type: "page", assets: stylesheets });
                const globalStylesheet = globalStylesheets["global"];
                if (globalStylesheet) {
                    context.output("style", { type: "global", asset: globalStylesheet });
                }
            });
        },
    };
}
