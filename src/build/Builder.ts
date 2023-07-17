import * as esbuild from "../../dep/esbuild.ts";
import { denoLoaderPlugin, denoResolverPlugin } from "../../dep/esbuild_deno_loader.ts";
import * as path from "../../dep/std/path.ts";

import { isInChildWatchProcess } from "../WatchContext.ts";
import { FrugalConfig } from "../Config.ts";
import { buildManifest } from "./plugins/buildManifest.ts";
import { cleanOutdir } from "./plugins/cleanOutdir.ts";
import { outputMetafile } from "./plugins/outputMetafile.ts";
import { reporter } from "./plugins/reporter.ts";
import { watchEmitter } from "./plugins/watchEmitter.ts";
import { log } from "../log.ts";
import { copyStatic } from "./plugins/copyStatic.ts";
import { PluginContext } from "../Plugin.ts";
import { cssLoader } from "./plugins/cssLoader.ts";

export class Builder {
    #config: FrugalConfig;

    constructor(config: FrugalConfig) {
        this.#config = config;
    }

    async build() {
        log("Start building", { scope: "Builder", level: "debug" });

        try {
            await esbuild.build(this.#esbuildConfig());
            log("Build done", { scope: "Builder", level: "debug" });
        } finally {
            esbuild.stop();
        }
    }

    async context() {
        log("Start watch context", { scope: "Builder", level: "debug" });

        return await esbuild.context(this.#esbuildConfig());
    }

    #esbuildConfig(): esbuild.BuildOptions {
        const context = new PluginContext(this.#config);
        const configRegExp = new RegExp(`${escapeRegExp(path.basename(path.fromFileUrl(this.#config.self)))}$`);

        const plugins: (esbuild.Plugin | boolean)[] = [
            denoResolverPlugin({
                importMapURL: this.#config.importMapURL?.href,
            }),
            {
                name: "frugal:loadConfig",
                setup: (build) => {
                    build.onResolve({ filter: configRegExp }, (args) => {
                        const url = context.url(args);
                        // compare pathname and not href because the url might include a
                        // cache busting hash (for the watch process)
                        if (url.pathname === this.#config.self.pathname) {
                            // resolve in an alternative namespace to avoid
                            // watching it. The deno watch process handles
                            // reloading the whole script if the config changes,
                            // we don't need esbuild to do the same
                            return { path: args.path, namespace: "frugal-config" };
                        }
                    });

                    build.onResolve({ filter: /./, namespace: "frugal-config" }, (args) => {
                        return { path: args.path };
                    });

                    build.onLoad({ filter: configRegExp, namespace: "frugal-config" }, async (args) => {
                        const url = context.url({ path: args.path, namespace: "file" });
                        const contents = await context.load(url);
                        return { loader: "ts", contents, resolveDir: path.dirname(path.fromFileUrl(url)) };
                    });
                },
            },
            ...this.#config.plugins.map((plugin) => plugin(context)),
            cssLoader(context),
            denoLoaderPlugin({
                importMapURL: this.#config.importMapURL?.href,
                nodeModulesDir: true,
            }),
            copyStatic(this.#config),
            outputMetafile(),
            buildManifest(this.#config, context.assets),
            cleanOutdir(this.#config),
            isInChildWatchProcess() && watchEmitter(),
            reporter(),
            {
                name: "frugal:cleanAssetMap",
                setup(build) {
                    build.onEnd(() => {
                        context.reset();
                    });
                },
            },
        ];

        const config: esbuild.BuildOptions = {
            ...this.#config.esbuildOptions,
            target: [],
            entryPoints: [
                ...this.#config.pages.map((page) => path.fromFileUrl(page)),
                path.fromFileUrl(this.#config.self),
            ],
            entryNames: "[dir]/[name]",
            chunkNames: "[dir]/[name]-[hash]",
            assetNames: "[dir]/[name]-[hash]",
            bundle: true,
            metafile: true,
            write: true,
            splitting: false,
            sourcemap: false,
            define: {
                ...this.#config.esbuildOptions?.define,
                // used to drop browser code in script assets
                "import.meta.main": "false",
            },
            format: "esm",
            outdir: path.fromFileUrl(this.#config.builddir),
            plugins: plugins.filter((plugin): plugin is esbuild.Plugin => Boolean(plugin)),
            absWorkingDir: path.fromFileUrl(new URL(".", this.#config.self)),
            logLevel: "silent",
            outExtension: { ".js": ".mjs" },
        };

        log(`esbuild config`, {
            level: "verbose",
            scope: "Builder",
            extra: JSON.stringify(config),
        });

        return config;
    }
}

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}