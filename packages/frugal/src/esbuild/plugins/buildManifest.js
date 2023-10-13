import * as esbuild from "../../../dependencies/esbuild.js";
import * as xxhash from "../../../dependencies/xxhash.js";

import { log } from "../../log.js";
import { MetaFileAnalyser } from "../MetafileAnalyser.js";
import { isInChildWatchProcess } from "../../watch/WatchContext.js";
import { FrugalConfig } from "../../Config.js";
import * as manifest from "../../Manifest.js";
import { Context } from "../../Plugin.js";

/**
 * @param {FrugalConfig} config
 * @param {Context} context
 * @returns {esbuild.Plugin}
 */
export function buildManifest(config, context) {
    return {
        name: "frugal-internal:buildManifest",
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

                    /** @type {manifest.WritableManifest} */
                    const writableManifest = {
                        pages: [],
                        id: "",
                        config: "",
                        assets: context.assets,
                    };

                    const idHasher = await xxhash.create();

                    for (const analysis of analysisResults) {
                        if (analysis === undefined) {
                            continue;
                        }

                        if (analysis.type === "config") {
                            writableManifest.config = isInChildWatchProcess()
                                ? `${analysis.moduleHash}-watch`
                                : analysis.moduleHash;

                            idHasher.update(writableManifest.config);
                        }

                        if (analysis.type === "page") {
                            writableManifest.pages.push({
                                moduleHash: analysis.moduleHash,
                                entrypoint: analysis.entrypoint,
                                outputPath: analysis.outputPath,
                            });

                            idHasher.update(analysis.moduleHash);
                        }
                    }

                    writableManifest.id = `${idHasher.digest()}}`;

                    log("Manifest built", {
                        scope: "buildManifest",
                        level: "debug",
                    });

                    await manifest.writeManifest(config, writableManifest);
                } catch (e) {
                    console.log(e);
                    throw e;
                }
            });
        },
    };
}
