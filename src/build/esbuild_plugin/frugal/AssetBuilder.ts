import * as esbuild from '../../../../dep/esbuild.ts';

import { Config } from '../../../Config.ts';
import { Asset, OutputEntryPoint } from '../../../Plugin.ts';
import { log } from '../../../log.ts';
import { Assets } from '../../../page/PageDescriptor.ts';

export class AssetBuilder {
  #metafile: esbuild.Metafile;
  #config: Config;

  constructor(metafile: esbuild.Metafile, config: Config) {
    this.#metafile = metafile;
    this.#config = config;
  }

  async build() {
    log('building assets', { scope: 'AssetBuilder' });
    const assets: Assets = {};

    await Promise.all(this.#config.plugins.map(async (plugin) => {
      const buildAssets = plugin.buildAssets;
      if (buildAssets === undefined) {
        return;
      }

      const generatedAssets = await buildAssets({
        metafile: this.#metafile,
        getAssets: (type: string) => this.#getAssets(type),
        getOutputEntryPoints: () => this.#getOutputEntryPoints(),
      });

      assets[plugin.name] = generatedAssets;
    }));

    log(`generated`, {
      scope: 'AssetBuilder',
      kind: 'debug',
      extra: JSON.stringify(assets),
    });

    return assets;
  }

  #getOutputEntryPoints(): OutputEntryPoint[] {
    const outputs = this.#metafile.outputs;

    const outputEntryPoints = [];

    for (const [outputPath, output] of Object.entries(outputs)) {
      const entryPoint = output.entryPoint;
      if (entryPoint === undefined) {
        continue;
      }

      outputEntryPoints.push({ ...output, entryPoint, path: outputPath });
    }

    return outputEntryPoints;
  }

  #getAssets(type: string) {
    const assets: Asset[] = [];

    const inputs = this.#metafile.inputs;

    const outputEntryPoints = this.#getOutputEntryPoints();

    for (const outputEntryPoint of outputEntryPoints) {
      const visited = new Set();
      const queue = [outputEntryPoint.entryPoint];
      let current: string | undefined = undefined;
      while ((current = queue.shift()) !== undefined) {
        if (visited.has(current)) {
          continue;
        }
        visited.add(current);

        const input = inputs[current];

        const imports = input.imports.slice().reverse();
        for (const imported of imports) {
          if (imported.external) {
            continue;
          }

          if (this.#config.isAsset(type, imported.path)) {
            assets.push({
              outputEntryPoint,
              url: new URL(imported.path, this.#config.self),
              kind: imported.kind,
            });
          } else {
            queue.push(imported.path);
          }
        }
      }
    }

    return assets.reverse();
  }
}
