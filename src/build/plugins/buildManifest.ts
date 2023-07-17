import * as path from "../../../dep/std/path.ts";
import * as esbuild from "../../../dep/esbuild.ts";

import { log } from "../../log.ts";
import { MetaFileAnalyser } from "../MetafileAnalyser.ts";
import { isInChildWatchProcess } from "../../WatchContext.ts";
import { FrugalConfig } from "../../Config.ts";
import { CompileError } from "../../page/Page.ts";
import { Assets } from "../../page/PageDescriptor.ts";

export type Manifest = {
    config: string;
    id: string;
    assets: Assets;
    pages: { moduleHash: string; entrypoint: string; outputPath: string }[];
};

export function buildManifest(config: FrugalConfig, assets: Assets): esbuild.Plugin {
    return {
        name: "frugal:buildManifest",
        setup: (build) => {
            build.onEnd(async (result) => {
                try {
                    const metafile = result.metafile;
                    const errors = result.errors;

                    if (errors.length !== 0 || metafile === undefined) {
                        return;
                    }

                    const analyser = new MetaFileAnalyser(config, metafile);
                    const analysisResults = await Promise.all(
                        Object.entries(metafile.outputs).map(([path, output]) => {
                            return analyser.analyseOutput(path, output);
                        }),
                    );

                    const manifest: Manifest = {
                        pages: [],
                        id: String(Date.now()),
                        config: "",
                        assets,
                    };

                    for (const analysis of analysisResults) {
                        if (analysis === undefined) {
                            continue;
                        }

                        if (analysis.type === "config") {
                            manifest.config = isInChildWatchProcess()
                                ? `${analysis.moduleHash}-watch`
                                : analysis.moduleHash;
                        }

                        if (analysis.type === "page") {
                            manifest.pages.push({
                                moduleHash: analysis.moduleHash,
                                entrypoint: analysis.entrypoint,
                                outputPath: analysis.outputPath,
                            });
                        }
                    }

                    log("Manifest built", {
                        scope: "buildManifest",
                        level: "debug",
                    });

                    await saveManifest(manifest);
                } catch (error) {
                    if (error instanceof CompileError) {
                        let message = error.message;

                        if (error.cause instanceof Error) {
                            message = `${message}: ${error.cause.message}`;
                        }

                        throw new Error(message);
                    }
                    console.log(error);
                    throw error;
                }
            });
        },
    };

    async function saveManifest(manifest: Manifest) {
        const filePath = path.resolve(path.fromFileUrl(config.cachedir), `manifest.mjs`);
        await Deno.writeTextFile(
            filePath,
            `${
                manifest.pages.map((page) => {
                    const url = new URL(page.outputPath, config.rootdir);
                    const importIdentifier = `./${path.relative(path.dirname(filePath), path.fromFileUrl(url))}`;
                    return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}#${page.moduleHash}";`;
                }).join("\n")
            }

export const id = ${JSON.stringify(manifest.id)};
export const config = ${JSON.stringify(manifest.config)};
export const assets = ${JSON.stringify(manifest.assets)};
export const pages = [${
                manifest.pages.map((page) =>
                    `{
    "moduleHash": "${page.moduleHash}",
    "entrypoint": "${page.entrypoint}",
    "descriptor": descriptor_${page.moduleHash},
}`
                ).join(",\n")
            }];
`,
        );
    }
}

/*
*/
