import * as esbuild from "../../../dependencies/esbuild.js";

import { log } from "../../log.js";

/** @returns {esbuild.Plugin} */
export function reporter() {
    let firstBuild = true;

    return {
        name: "frugal-internal:reporter",
        setup(build) {
            build.onStart(() => {
                if (!firstBuild) {
                    log("Rebuild triggered", { level: "info", scope: "esbuild" });
                }
                firstBuild = false;
            });

            build.onEnd(async (result) => {
                const errors = result.errors;
                const warnings = result.warnings;

                for (const error of errors) {
                    const formatted = (
                        await esbuild.formatMessages([error], {
                            kind: "error",
                            color: true,
                            terminalWidth: 100,
                        })
                    ).join("\n");

                    log("error during build", {
                        level: "error",
                        scope: "esbuild",
                        extra: formatted,
                    });
                }

                for (const warning of warnings) {
                    const formatted = (
                        await esbuild.formatMessages([warning], {
                            kind: "warning",
                            color: true,
                            terminalWidth: 100,
                        })
                    ).join("\n");

                    log("warning during build", {
                        level: "warning",
                        scope: "esbuild",
                        extra: formatted,
                    });
                }
            });
        },
    };
}
