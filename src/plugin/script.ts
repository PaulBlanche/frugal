import * as esbuild from "../../dep/esbuild.ts";
import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";
import { denoLoaderPlugin, denoResolverPlugin } from "../../dep/esbuild_deno_loader.ts";

import { Plugin } from "../Plugin.ts";
import { log } from "../log.ts";
import { cleanOutdir } from "../build/plugins/cleanOutdir.ts";
import { outputMetafile } from "../build/plugins/outputMetafile.ts";
import { FrugalConfig } from "../Config.ts";

type ScriptOptions = {
    outdir: string;
    filter: RegExp;
};

type ContextCache = { id: string; context: esbuild.BuildContext };

export function script(
    { outdir = "js/", filter = /\.script.[tj]sx?$/ }: Partial<ScriptOptions> = {},
): Plugin {
    return (frugal) => {
        let contextCache: ContextCache | undefined = undefined;

        return {
            name: "frugal:script",
            setup(build) {
                build.onLoad({ filter }, async (args) => {
                    const url = frugal.url(args);
                    const contents = await frugal.load(url);
                    return { loader: "ts", contents };
                });

                build.onEnd(async (result) => {
                    const metafile = result.metafile;
                    const errors = result.errors;

                    if (errors.length !== 0 || metafile === undefined) {
                        return;
                    }

                    const assets = frugal.collect(filter, metafile);

                    const facadesMap: Record<string, Facade> = {};

                    for (const asset of assets) {
                        const entrypoint = asset.entrypoint;
                        const facadePath = path.resolve(frugal.config.tempdir, "asset", "script", entrypoint);
                        const facadeContent = `import "${asset.path}";`;
                        facadesMap[entrypoint] = facadesMap[entrypoint] ?? {
                            entrypoint,
                            path: facadePath,
                            content: [],
                        };
                        facadesMap[entrypoint].content.push(facadeContent);
                    }

                    const facades = Object.values(facadesMap);

                    await Promise.all(
                        facades.map(async (facade) => {
                            await fs.ensureFile(facade.path);
                            await Deno.writeTextFile(facade.path, facade.content.join("\n"));
                        }),
                    );

                    const context = await getContext(
                        facades.map((facade) => facade.path),
                        frugal.config,
                    );

                    const buildResult = await context.rebuild();

                    frugal.output("script", {
                        type: "page",
                        assets: getJsBundle(buildResult.metafile, facades, frugal.config),
                    });
                });

                async function getContext(
                    entrypoints: string[],
                    config: FrugalConfig,
                ): Promise<
                    esbuild.BuildContext<
                        Omit<esbuild.BuildOptions, "metafile"> & { metafile: true }
                    >
                > {
                    const id = entrypoints.slice().sort().join("");
                    if (contextCache?.id !== id) {
                        if (contextCache !== undefined) {
                            log(
                                "script entrypoints list has changed, recreate esbuild context",
                                { level: "debug", scope: "plugin:script", extra: entrypoints.join("\n") },
                            );

                            await contextCache.context.dispose();
                        }
                        contextCache = { id, context: await setupContext(entrypoints, config) };
                    }

                    return contextCache.context;
                }

                function setupContext(
                    entrypoints: string[],
                    config: FrugalConfig,
                ): Promise<
                    esbuild.BuildContext<
                        Omit<esbuild.BuildOptions, "metafile"> & { metafile: true }
                    >
                > {
                    const parentConfig = build.initialOptions;
                    const outdirPath = path.resolve(config.publicdir, outdir);
                    const esbuildConfig: esbuild.BuildOptions = {
                        ...config.esbuildOptions,
                        target: config.esbuildOptions?.target === undefined ||
                                config.esbuildOptions.target === "es6-modules"
                            ? ["es2020", "edge88", "firefox78", "chrome87", "safari14"]
                            : config.esbuildOptions.target,
                        define: {
                            ...config.esbuildOptions?.define,
                            "import.meta.environment": "'client'",
                        },
                        entryNames: "[dir]/[name]-[hash]",
                        chunkNames: "[dir]/[name]-[hash]",
                        assetNames: "[dir]/[name]-[hash]",
                        outdir: outdirPath,
                        plugins: [
                            denoResolverPlugin({
                                importMapURL: frugal.config.importMapURL?.href,
                            }),
                            ...(parentConfig.plugins?.filter((plugin) =>
                                plugin.name.startsWith("frugal:") && plugin.name !== "frugal:script"
                            ) ?? []),
                            ...(frugal.config.esbuildOptions?.plugins ?? []),
                            denoLoaderPlugin({
                                importMapURL: frugal.config.importMapURL?.href,
                                nodeModulesDir: true,
                            }),
                            cleanOutdir(config, false),
                            outputMetafile(),
                        ],
                        loader: { ".css": "empty" },
                        format: "esm",
                        entryPoints: entrypoints,
                        bundle: true,
                        metafile: true,
                        absWorkingDir: config.outdir,
                    };

                    log(`asset esbuild config`, {
                        level: "verbose",
                        scope: "plugin:script",
                        extra: JSON.stringify(esbuildConfig),
                    });

                    return esbuild.context(esbuildConfig);
                }
            },
        };
    };
}

function getJsBundle(
    metafile: esbuild.Metafile,
    facades: Facade[],
    config: FrugalConfig,
) {
    const generated: Record<string, string> = {};

    const outputs = Object.entries(metafile.outputs);

    for (const [outputPath, output] of outputs) {
        if (output.entryPoint === undefined) {
            continue;
        }

        const outputEntrypointPath = path.resolve(config.outdir, output.entryPoint);

        const facade = facades.find((facade) => facade.path === outputEntrypointPath);

        if (facade === undefined) {
            continue;
        }

        const jsBundleUrl = path.resolve(config.outdir, outputPath);
        const bundleName = path.relative(config.publicdir, jsBundleUrl);

        generated[facade.entrypoint] = `/${bundleName}`;
    }

    return generated;
}

type Facade = { entrypoint: string; path: string; content: string[] };
