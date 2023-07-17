import * as esbuild from "../../../dep/esbuild.ts";
import * as fs from "../../../dep/std/fs.ts";

import { FrugalConfig } from "../../Config.ts";

export function copyStatic(config: FrugalConfig): esbuild.Plugin {
    return {
        name: "esbuild:copyStatic",
        setup(build) {
            build.onEnd(async () => {
                try {
                    await fs.copy(config.staticdir, config.publicdir, {
                        overwrite: true,
                    });
                } catch (e) {
                    if (!(e instanceof Deno.errors.NotFound)) {
                        throw e;
                    }
                }
            });
        },
    };
}
