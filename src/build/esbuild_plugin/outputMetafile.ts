import * as esbuild from '../../../dep/esbuild.ts';
import * as path from '../../../dep/std/path.ts';
import * as fs from '../../../dep/std/fs.ts';
import { log } from '../../log.ts';
import { Config } from '../../Config.ts';

export function outputMetafile(config: Config): esbuild.Plugin {
    return {
        name: 'esbuild:outputMetafile',
        setup(build) {
            const initialOptions = build.initialOptions;

            const cwd = path.toFileUrl(
                initialOptions.absWorkingDir ?? Deno.cwd(),
            );
            const outdir = initialOptions.outdir ?? '.';

            const outdirURL = new URL(outdir, cwd);
            const metafileURL = new URL('meta.json', outdirURL);

            build.onEnd(async (result) => {
                const metafile = result.metafile;

                if (metafile) {
                    log(
                        `output ${
                            path.relative(
                                path.fromFileUrl(new URL('.', config.self)),
                                path.fromFileUrl(metafileURL),
                            )
                        }`,
                        { kind: 'debug', scope: 'esbuild:outputMetafile' },
                    );

                    await fs.ensureFile(metafileURL);
                    await Deno.writeTextFile(
                        metafileURL,
                        JSON.stringify(metafile, undefined, 2),
                    );
                }
            });
        },
    };
}
