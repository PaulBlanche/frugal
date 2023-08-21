import * as path from "../../../dep/std/path.ts";
import * as esbuild from "../../../dep/esbuild.ts";

import { FrugalConfig } from "../../Config.ts";
import { log } from "../../log.ts";

export function cleanOutdir(config: FrugalConfig, cleanAll: boolean): esbuild.Plugin {
    return {
        name: "__frugal_internal:cleanOutdir",
        setup(build) {
            let isFirstBuild = true;

            const initialOptions = build.initialOptions;
            const cwd = initialOptions.absWorkingDir ?? Deno.cwd();
            const esbuildOutDir = path.resolve(cwd, initialOptions.outdir ?? ".");

            build.onStart(async () => {
                if (!isFirstBuild) {
                    return;
                }

                try {
                    if (cleanAll) {
                        log(
                            `clean directory ${config.outdir}`,
                            {
                                level: "debug",
                                scope: "cleanOutdir",
                            },
                        );

                        for await (const entry of Deno.readDir(config.outdir)) {
                            const entryPath = path.resolve(config.outdir, entry.name);
                            if (!entry.isDirectory || `${entryPath}/` !== config.cachedir) {
                                await Deno.remove(entryPath, {
                                    recursive: true,
                                });
                            }
                        }
                    } else {
                        log(
                            `clean directory ${esbuildOutDir}`,
                            {
                                level: "debug",
                                scope: "cleanOutdir",
                            },
                        );

                        await Deno.remove(esbuildOutDir, {
                            recursive: true,
                        });
                    }
                } catch (error) {
                    if (!(error instanceof Deno.errors.NotFound)) {
                        throw error;
                    }
                }

                isFirstBuild = false;
            });
        },
    };
}
