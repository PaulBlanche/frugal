import * as esbuild from "../../../dependencies/esbuild.js";
import * as path from "../../../dependencies/path.js";
import * as fs from "../../../dependencies/fs.js";

import { FrugalConfig } from "../../Config.js";
import { log } from "../../log.js";

/**
 * @param {FrugalConfig} config
 * @param {boolean} cleanAll
 * @returns {esbuild.Plugin}
 */
export function cleanOutdir(config, cleanAll) {
    return {
        name: "frugal-internal:cleanOutdir",
        setup(build) {
            let isFirstBuild = true;

            const initialOptions = build.initialOptions;
            const cwd = initialOptions.absWorkingDir ?? process.cwd();
            const esbuildOutDir = path.resolve(cwd, initialOptions.outdir ?? ".");

            build.onStart(async () => {
                if (!isFirstBuild) {
                    return;
                }

                try {
                    if (cleanAll) {
                        log(`clean directory ${config.outdir}`, {
                            level: "debug",
                            scope: "cleanOutdir",
                        });

                        const directory = await fs.readDir(config.outdir);
                        for await (const entry of directory) {
                            const entryPath = path.resolve(config.outdir, entry.name);
                            if (!entry.isDirectory() || `${entryPath}/` !== config.cachedir) {
                                await fs.remove(entryPath, {
                                    recursive: true,
                                });
                            }
                        }
                    } else {
                        log(`clean directory ${esbuildOutDir}`, {
                            level: "debug",
                            scope: "cleanOutdir",
                        });

                        await fs.remove(esbuildOutDir, {
                            recursive: true,
                        });
                    }
                } catch (/** @type {any} */ error) {
                    if (!(error instanceof fs.errors.NotFound)) {
                        throw error;
                    }
                }

                isFirstBuild = false;
            });
        },
    };
}
