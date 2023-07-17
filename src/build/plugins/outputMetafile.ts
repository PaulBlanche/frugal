import * as path from "../../../dep/std/path.ts";
import * as fs from "../../../dep/std/fs.ts";
import * as esbuild from "../../../dep/esbuild.ts";

export function outputMetafile(): esbuild.Plugin {
    return {
        name: "frugal:outputMetafile",
        setup(build) {
            const initialOptions = build.initialOptions;
            const cwd = path.toFileUrl(initialOptions.absWorkingDir ?? Deno.cwd());
            const outdir = initialOptions.outdir ?? ".";
            const outdirURL = new URL(outdir, cwd);

            const metafileURL = new URL("meta.json", outdirURL);

            build.onEnd(async (result) => {
                const metafile = result.metafile;

                if (metafile) {
                    await fs.ensureFile(metafileURL);
                    await Deno.writeTextFile(metafileURL, JSON.stringify(metafile, undefined, 2));
                }
            });
        },
    };
}
