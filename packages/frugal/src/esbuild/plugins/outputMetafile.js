import * as path from "../../../dependencies/path.js";
import * as fs from "../../../dependencies/fs.js";
import * as esbuild from "../../../dependencies/esbuild.js";

/** @returns {esbuild.Plugin} */
export function outputMetafile() {
    return {
        name: "frugal-internal:outputMetafile",
        setup(build) {
            const initialOptions = build.initialOptions;
            const cwd = initialOptions.absWorkingDir ?? process.cwd();
            const outdir = initialOptions.outdir ?? ".";
            const outdirPath = path.resolve(cwd, outdir);

            const metafilePath = path.resolve(outdirPath, "meta.json");

            build.onEnd(async (result) => {
                const metafile = result.metafile;
                const outputFiles = result.outputFiles;

                if (metafile) {
                    await fs.ensureFile(metafilePath);
                    await fs.writeTextFile(metafilePath, JSON.stringify(metafile, undefined, 2));
                }

                if (outputFiles) {
                    await Promise.all(outputFiles.map((out) => writeOutFile(out)));
                }
            });
        },
    };
}

/** @param {esbuild.OutputFile} out */
async function writeOutFile(out) {
    try {
        await fs.ensureDir(path.dirname(out.path));
        await fs.writeFile(out.path, out.contents, { createNew: true });
    } catch (/** @type {any} */ error) {
        if (!(error instanceof fs.errors.AlreadyExists)) {
            throw error;
        }
    }
}
