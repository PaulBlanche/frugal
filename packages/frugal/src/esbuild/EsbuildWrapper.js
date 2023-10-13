import * as esbuild from "../../dependencies/esbuild.js";
import * as path from "../../dependencies/path.js";

import { FrugalConfig } from "../Config.js";
import { log } from "../log.js";
import { Context } from "../Plugin.js";
import { buildManifest } from "./plugins/buildManifest.js";
import { cleanOutdir } from "./plugins/cleanOutdir.js";
import { outputMetafile } from "./plugins/outputMetafile.js";
import { reporter } from "./plugins/reporter.js";
import { copyStatic } from "./plugins/copyStatic.js";
import { css } from "./plugins/css.js";
import { frugalResolver } from "./plugins/frugalResolver.js";

export class EsbuildWrapper {
    /** @type {FrugalConfig} */
    #config;
    /** @type {esbuild.Plugin[]} */
    #plugins;

    /**
     * @param {FrugalConfig} config
     * @param {esbuild.Plugin[]} [plugins]
     */
    constructor(config, plugins = []) {
        this.#config = config;
        this.#plugins = plugins;
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

    /** @returns {esbuild.BuildOptions} */
    #esbuildConfig() {
        const context = new Context(this.#config);

        /** @type {(esbuild.Plugin | boolean)[]} */
        const plugins = [
            ...this.#config.plugins.map((plugin) => plugin(context)),
            ...(this.#config.esbuildOptions?.plugins ?? []),
            outputMetafile(),
            css(context),
            copyStatic(this.#config),
            buildManifest(this.#config, context),
            cleanOutdir(this.#config, this.#config.cleanAll),
            reporter(),
            {
                name: "frugal-internal:cleanAssetMap",
                setup(build) {
                    build.onEnd(() => {
                        context.reset();
                    });
                },
            },
            frugalResolver(context),
            ...this.#plugins,
        ];

        /** @satisfies {esbuild.BuildOptions} */
        const config = {
            ...this.#config.esbuildOptions,
            target: [],
            entryPoints: [
                ...this.#config.pages.map((page) => path.resolve(this.#config.rootdir, page)),
                this.#config.self,
            ],
            entryNames: "[dir]/[name]-[hash]",
            chunkNames: "[dir]/[name]-[hash]",
            assetNames: "[dir]/[name]-[hash]",
            bundle: true,
            metafile: true,
            write: false,
            splitting: true,
            sourcemap: false,
            define: {
                ...this.#config.esbuildOptions?.define,
                // used to drop browser code in script assets
                "import.meta.environment": "'server'",
            },
            format: "esm",
            outdir: this.#config.builddir,
            plugins: plugins.filter(
                /** @returns {plugin is esbuild.Plugin} */ (plugin) => Boolean(plugin),
            ),
            absWorkingDir: this.#config.rootdir,
            logLevel: "silent",
            outExtension: { ".js": ".mjs" },
            platform: "node",
        };

        if (this.#config.globalCss) {
            config.entryPoints.push(path.resolve(this.#config.rootdir, this.#config.globalCss));
        }

        log(`esbuild config`, {
            level: "verbose",
            scope: "Builder",
            extra: JSON.stringify(config),
        });

        return config;
    }
}
