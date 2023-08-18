import * as esbuild from "../../../dep/esbuild.ts";
import * as xxhash from "../../../dep/xxhash.ts";

import { log } from "../../log.ts";
import { MetaFileAnalyser } from "../MetafileAnalyser.ts";
import { isInChildWatchProcess } from "../../WatchContext.ts";
import { FrugalConfig } from "../../Config.ts";
import { CompileError } from "../../page/Page.ts";
import { Assets } from "../../page/PageDescriptor.ts";
import { writeManifest } from "../../Manifest.ts";

type Manifest = {
    config: string;
    id: string;
    assets: Assets;
    pages: { moduleHash: string; entrypoint: string; outputPath: string }[];
};

export function buildManifest(config: FrugalConfig, assets: Assets): esbuild.Plugin {
    return {
        name: "__frugal_internal:buildManifest",
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
                        id: "",
                        config: "",
                        assets,
                    };

                    const idHash = await xxhash.create();

                    for (const analysis of analysisResults) {
                        if (analysis === undefined) {
                            continue;
                        }

                        if (analysis.type === "config") {
                            manifest.config = isInChildWatchProcess()
                                ? `${analysis.moduleHash}-watch`
                                : analysis.moduleHash;

                            idHash.hash(manifest.config);
                        }

                        if (analysis.type === "page") {
                            manifest.pages.push({
                                moduleHash: analysis.moduleHash,
                                entrypoint: analysis.entrypoint,
                                outputPath: analysis.outputPath,
                            });

                            idHash.hash(analysis.moduleHash);
                        }
                    }

                    manifest.id = `${idHash.digest("hex").toString()}}`;

                    log("Manifest built", {
                        scope: "buildManifest",
                        level: "debug",
                    });

                    await writeManifest(config, manifest);
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
}
