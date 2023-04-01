import * as esbuild from '../../../dep/esbuild.ts';

import { Config } from '../../Config.ts';
import { cleanOutdir } from './cleanOutdir.ts';
import { denoResolve } from './denoResolve.ts';
import { reporter } from './reporter.ts';
import { frugal } from './frugal/mod.ts';
import { outputMetafile } from './outputMetafile.ts';
import { buildEndEmitter, buildStartEmitter } from './watchEmitter.ts';
import { copyStatic } from './copyStatic.ts';

export function getPlugins(
  config: Config,
  isExport?: boolean,
): esbuild.Plugin[] {
  const plugins = [
    buildStartEmitter(config),
    ...(config.esbuildOptions?.plugins ?? []),
  ];

  for (const plugin of config.plugins) {
    for (const esbuildPlugin of plugin.server) {
      plugins.push(esbuildPlugin);
    }
  }

  plugins.push(
    outputMetafile(config),
    frugal({ config, isExport }),
    denoResolve({ config }),
    cleanOutdir(config),
    buildEndEmitter(config),
    copyStatic(config),
    reporter(),
  );

  return plugins;
}
