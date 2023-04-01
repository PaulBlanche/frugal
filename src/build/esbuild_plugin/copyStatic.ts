import * as esbuild from '../../../dep/esbuild.ts';
import * as fs from '../../../dep/std/fs.ts';

import { Config } from '../../Config.ts';

export function copyStatic(config: Config): esbuild.Plugin {
  return {
    name: 'esbuild:copyStatic',
    setup(build) {
      build.onEnd(async () => {
        try {
          await fs.copy(config.staticDir, config.publicdir, {
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
