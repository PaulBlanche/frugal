import * as esbuild from "../../../dependencies/esbuild.js";
import * as fs from "../../../dependencies/fs.js";

import { FrugalConfig } from "../../Config.js";

/**
 * @param {FrugalConfig} config
 * @returns {esbuild.Plugin}
 */
export function copyStatic(config) {
    return {
        name: "frugal-internal:copyStatic",
        setup(build) {
            build.onEnd(async () => {
                try {
                    await fs.copy(config.staticdir, config.publicdir, {
                        overwrite: true,
                    });
                } catch (/** @type {any} */ error) {
                    if (!(error instanceof fs.errors.NotFound)) {
                        throw error;
                    }
                }
            });
        },
    };
}
