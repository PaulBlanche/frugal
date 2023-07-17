import * as esbuild from "../../../dep/esbuild.ts";
import * as path from "../../../dep/std/path.ts";
import * as fs from "../../../dep/std/fs.ts";
import { denoLoaderPlugin, denoResolverPlugin } from "../../../dep/esbuild_deno_loader.ts";

import { PluginContext } from "../../Plugin.ts";
import { FrugalConfig } from "../../Config.ts";
import { cleanOutdir } from "./cleanOutdir.ts";
import { outputMetafile } from "./outputMetafile.ts";
import { log } from "../../log.ts";

type ContextCache = { id: string; context: esbuild.BuildContext };

const CSS_FILTER = /\.css$/;

export function cssLoader(context: PluginContext): esbuild.Plugin {
    let contextCache: ContextCache | undefined = undefined;

    return {
        name: "frugal:css-loader",
        setup(build) {
            build.onEnd(async (result) => {
                try {
                    const metafile = result.metafile;
                    const errors = result.errors;

                    if (errors.length !== 0 || metafile === undefined) {
                        return;
                    }

                    const assets = context.collect(CSS_FILTER, metafile);

                    if (assets.length === 0) {
                        return;
                    }

                    const facadesMap: Record<string, Facade> = {};

                    for (const asset of assets) {
                        const entrypoint = asset.entrypoint;
                        const facadePath = path.join("asset", "style", `${entrypoint}.css`);
                        const facadeUrl = new URL(facadePath, context.config.cachedir);
                        const facadeContent = `@import url("${asset.url.href}");`;
                        facadesMap[entrypoint] = facadesMap[entrypoint] ?? {
                            entrypoint,
                            url: facadeUrl,
                            content: [],
                        };
                        facadesMap[entrypoint].content.push(facadeContent);
                    }

                    const facades = Object.values(facadesMap);

                    await Promise.all(
                        facades.map(async (facade) => {
                            await fs.ensureFile(facade.url);
                            await Deno.writeTextFile(facade.url, facade.content.join("\n"));
                        }),
                    );

                    const esbuildContext = await getEsbuildContext(
                        facades.map((facade) => path.fromFileUrl(facade.url)),
                        context.config,
                    );

                    const buildResult = await esbuildContext.rebuild();

                    context.output("style", getCssBundle(buildResult.metafile, facades, context.config));
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            });
        },
    };

    async function getEsbuildContext(
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
                    { level: "debug", scope: "plugin:script" },
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
        const outdirURL = new URL("css/", config.publicdir);
        const esbuildConfig: esbuild.BuildOptions = {
            ...config.esbuildOptions,
            target: config.esbuildOptions?.target === undefined || config.esbuildOptions.target === "es6-modules"
                ? ["es2020", "edge88", "firefox78", "chrome87", "safari14"]
                : config.esbuildOptions.target,
            define: {
                ...config.esbuildOptions?.define,
                "import.meta.main": "true",
            },
            outdir: path.fromFileUrl(outdirURL),
            plugins: [
                denoResolverPlugin(),
                ...(config.esbuildOptions?.plugins ?? []),
                {
                    name: "frugal:loadcss",
                    setup(build) {
                        build.onResolve({ filter: /\.jpg$/ }, (args) => {
                            return { path: args.path, external: true };
                        });

                        build.onResolve({ filter: CSS_FILTER }, (args) => {
                            return { path: args.path };
                        });

                        build.onLoad({ filter: CSS_FILTER }, async (args) => {
                            try {
                                const url = context.url(args);

                                const virtualModule = context.getVirtualFile(url.href);
                                if (virtualModule) {
                                    return { loader: "css", contents: virtualModule };
                                }
                                const contents = await context.load(url);
                                return { loader: "css", contents };
                            } catch (e) {
                                console.log(e);
                                throw e;
                            }
                        });
                    },
                },
                denoLoaderPlugin(),
                cleanOutdir(config),
                outputMetafile(),
            ],
            format: "esm",
            entryPoints: entrypoints,
            bundle: true,
            metafile: true,
            absWorkingDir: path.fromFileUrl(new URL(".", config.self)),
        };

        log(`css loader esbuild config`, {
            level: "verbose",
            scope: "frugal:cssLoader",
            extra: JSON.stringify(esbuildConfig),
        });

        return esbuild.context(esbuildConfig);
    }
}

type Facade = { entrypoint: string; url: URL; content: string[] };

function getCssBundle(
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

        const outputEntrypointUrl = new URL(output.entryPoint, config.self);

        const facade = facades.find(
            (facade) => facade.url.href === outputEntrypointUrl.href,
        );

        if (facade === undefined) {
            continue;
        }

        const cssBundleUrl = new URL(outputPath, config.self);
        const bundleName = path.relative(
            path.fromFileUrl(config.publicdir),
            path.fromFileUrl(cssBundleUrl),
        );

        config.budget.check({
            metafile,
            outputPath,
            type: "style",
            scope: "frugal:style",
        });

        generated[facade.entrypoint] = `/${bundleName}`;
    }

    return generated;
}
