import * as _type from "./_type/script.js";
export * from "./_type/script.js";

import * as plugin from "../../Plugin.js";
import { Compiler } from "./Compiler.js";
import { Bundler } from "./Bundler.js";

/**
 * @param {Partial<_type.ScriptOptions>} [param0]
 * @returns {plugin.Plugin}
 */
export function script({ outdir = "js/", denoConfig, filter = /\.script.m?[tj]sx?$/ } = {}) {
    return (pluginContext) => {
        const compiler = new Compiler(pluginContext.config, outdir, denoConfig);

        return {
            name: "frugal:script",
            setup(build) {
                build.onEnd(async (result) => {
                    const metafile = result.metafile;
                    const errors = result.errors;

                    if (errors.length !== 0 || metafile === undefined) {
                        return;
                    }

                    const bundler = new Bundler(compiler, pluginContext.config);

                    const outputedBundles = await bundler.bundle(
                        pluginContext.collect(filter, metafile),
                        build,
                    );

                    pluginContext.output("script", {
                        type: "page",
                        assets: outputedBundles,
                    });
                });

                build.onDispose(() => {
                    compiler.dispose();
                });
            },
        };
    };
}
