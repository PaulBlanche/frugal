import * as esbuild from "../../../dep/esbuild.ts";

import { log } from "../../log.ts";

export function reporter(): esbuild.Plugin {
    let firstBuild = true;
    return {
        name: "__frugal_internal:reporter",
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
                    const formatted = (await esbuild.formatMessages([
                        error,
                    ], {
                        kind: "error",
                        color: true,
                        terminalWidth: 100,
                    })).join("\n");

                    log("error during build", {
                        level: "error",
                        scope: "esbuild",
                        extra: formatted,
                    });
                }

                for (const warning of warnings) {
                    const formatted = (await esbuild.formatMessages([
                        warning,
                    ], {
                        kind: "warning",
                        color: true,
                        terminalWidth: 100,
                    })).join("\n");

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
