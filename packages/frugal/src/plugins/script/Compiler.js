import * as _type from "./_type/Compiler.js";
export * from "./_type/Compiler.js";

import * as esbuild from "../../../dependencies/esbuild.js";
import * as path from "../../../dependencies/path.js";

import { FrugalConfig } from "../../Config.js";
import { cleanOutdir } from "../../esbuild/plugins/cleanOutdir.js";
import { outputMetafile } from "../../esbuild/plugins/outputMetafile.js";
import { log } from "../../log.js";

export class Compiler {
    /** @type {_type.ContextCache | undefined} */
    #contextCache;
    /** @type {string} */
    #outdir;
    /** @type {FrugalConfig} */
    #config;
    /** @type {string | undefined} */
    #denoConfig;

    /**
     * @param {FrugalConfig} config
     * @param {string} outdir
     * @param {string} [denoConfig]
     */
    constructor(config, outdir, denoConfig) {
        this.#config = config;
        this.#outdir = outdir;
        this.#denoConfig = denoConfig;
    }

    /**
     * @param {string[]} entrypoints
     * @param {esbuild.PluginBuild} pluginBuild
     */
    async compile(entrypoints, pluginBuild) {
        const context = await this.#getContext(entrypoints, pluginBuild);

        return context.rebuild();
    }

    async dispose() {
        this.#contextCache?.context.dispose();
    }

    /**
     * @param {string[]} entrypoints
     * @param {esbuild.PluginBuild} pluginBuild
     * @returns {Promise<_type.EsbuildContext>}
     */
    async #getContext(entrypoints, pluginBuild) {
        const id = entrypoints.slice().sort().join("");

        if (this.#contextCache?.id !== id) {
            if (this.#contextCache !== undefined) {
                log("script entrypoints list has changed, recreate esbuild context", {
                    level: "debug",
                    scope: "plugin:script",
                    extra: entrypoints.join("\n"),
                });

                await this.#contextCache.context.dispose();
            }
            this.#contextCache = {
                id,
                context: await this.#createContext(entrypoints, pluginBuild),
            };
        }

        return this.#contextCache.context;
    }

    /**
     * @param {string[]} entrypoints
     * @param {esbuild.PluginBuild} pluginBuild
     * @returns {Promise<_type.EsbuildContext>}
     */
    async #createContext(entrypoints, pluginBuild) {
        const parentConfig = pluginBuild.initialOptions;
        const outdirPath = path.resolve(this.#config.publicdir, this.#outdir);

        /** @satisfies {esbuild.BuildOptions} */
        const esbuildConfig = {
            ...this.#config.esbuildOptions,
            target:
                this.#config.esbuildOptions?.target === undefined ||
                this.#config.esbuildOptions.target === "es6-modules"
                    ? ["es2020", "edge88", "firefox78", "chrome87", "safari14"]
                    : this.#config.esbuildOptions.target,
            define: {
                ...this.#config.esbuildOptions?.define,
                "import.meta.environment": "'client'",
            },
            entryNames: "[dir]/[name]-[hash]",
            chunkNames: "[dir]/[name]-[hash]",
            assetNames: "[dir]/[name]-[hash]",
            outdir: outdirPath,
            plugins: [
                ...(parentConfig.plugins?.filter(
                    (plugin) =>
                        plugin.name.startsWith("frugal:") && plugin.name !== "frugal:script",
                ) ?? []),
                ...(this.#config.esbuildOptions?.plugins ?? []),
                cleanOutdir(this.#config, false),
                outputMetafile(),
            ],
            loader: { ".css": "empty" },
            format: "esm",
            entryPoints: entrypoints,
            bundle: true,
            metafile: true,
            absWorkingDir: this.#config.rootdir,
        };

        if (this.#config.platform === "deno") {
            const { denoResolverPlugin, denoLoaderPlugin } = await import(
                "../../../dependencies/esbuild_deno_loader.js"
            );
            esbuildConfig.plugins.unshift(
                denoResolverPlugin({
                    configPath:
                        this.#denoConfig && path.resolve(this.#config.rootdir, this.#denoConfig),
                }),
            );
            esbuildConfig.plugins.push(
                denoLoaderPlugin({
                    configPath:
                        this.#denoConfig && path.resolve(this.#config.rootdir, this.#denoConfig),
                }),
            );
        }

        log(`asset esbuild config`, {
            level: "verbose",
            scope: "plugin:script",
            extra: JSON.stringify(esbuildConfig),
        });

        return esbuild.context(esbuildConfig);
    }
}
