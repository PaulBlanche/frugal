import * as path from "../../../dep/std/path.ts";
import * as fs from "../../../dep/std/fs.ts";
import * as streams from "../../../dep/std/streams.ts";
import * as esbuild from "../../../dep/esbuild.ts";

export function outputMetafile(): esbuild.Plugin {
    return {
        name: "__frugal_internal:outputMetafile",
        setup(build) {
            const initialOptions = build.initialOptions;
            const cwd = path.toFileUrl(initialOptions.absWorkingDir ?? Deno.cwd());
            const outdir = initialOptions.outdir ?? ".";
            const outdirURL = new URL(outdir, cwd);

            const metafileURL = new URL("meta.json", outdirURL);

            build.onEnd(async (result) => {
                const metafile = result.metafile;
                const outputFiles = result.outputFiles;

                if (metafile) {
                    await fs.ensureFile(metafileURL);
                    await Deno.writeTextFile(metafileURL, JSON.stringify(metafile, undefined, 2));
                }

                if (outputFiles) {
                    await Promise.all(outputFiles.map((out) => writeOutFile(out)));
                }
            });
        },
    };
}

async function writeOutFile(out: esbuild.OutputFile) {
    try {
        await fs.ensureDir(path.dirname(out.path));
        const file = await Deno.open(out.path, { write: true, createNew: true });
        try {
            await streams.writeAll(file, out.contents);
        } finally {
            file.close();
        }
    } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
            throw error;
        }
    }
}
