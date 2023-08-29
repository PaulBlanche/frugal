import * as esbuild from "../../../dep/esbuild.ts";
import * as path from "../../../dep/std/path.ts";
import * as xxhash from "../../../dep/xxhash.ts";

import { log } from "../../log.ts";
import { MetaFileAnalyser } from "../MetafileAnalyser.ts";
import { isInChildWatchProcess } from "../../WatchContext.ts";
import { FrugalConfig } from "../../Config.ts";
import { WritableManifest, writeManifest } from "../../Manifest.ts";
import { PluginContext } from "../../Plugin.ts";

export function buildManifest(config: FrugalConfig, context: PluginContext): esbuild.Plugin {
    return {
        name: "__frugal_internal:buildManifest",
        setup: (build) => {
            build.onEnd(async (result) => {
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

                const manifest: WritableManifest = {
                    pages: [],
                    id: "",
                    config: "",
                    assets: context.assets,
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
                            route: analysis.route,
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
            });
        },
    };
}
