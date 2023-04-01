import * as path from '../../../dep/std/path.ts';
import * as esbuild from '../../../dep/esbuild.ts';
import * as fs from '../../../dep/std/fs.ts';

import { Asset, Plugin } from '../../Plugin.ts';
import { Config } from '../../Config.ts';
import { cleanOutdir } from '../esbuild_plugin/cleanOutdir.ts';
import { outputMetafile } from '../esbuild_plugin/outputMetafile.ts';
import { denoResolve } from '../esbuild_plugin/denoResolve.ts';
import { log } from '../../log.ts';
import * as utils from './utils.ts';

type StyleOptions = {
  outdir: string;
  filter: RegExp;
};

type CurrentEsbuildContext = {
  id: string;
  context: esbuild.BuildContext;
} | undefined;

export function style(
  { outdir = 'css/', filter = /\.css$/ }: Partial<StyleOptions> = {},
): Plugin {
  let currentEsbuildContext: CurrentEsbuildContext = undefined;

  return {
    name: 'style',
    create(build) {
      const config = build.config;

      build.includeAsset({ type: 'css', filter });

      build.register({
        type: 'server',
        setup: (build) => {
          build.onLoad({ filter }, async (args) => {
            const { specifier, loaded } = await config.loader.load(args);
            log(`found css entrypoint "${utils.name(specifier, config)}"`, {
              kind: 'debug',
              scope: 'plugin:style',
            });

            return { ...loaded, loader: 'empty' };
          });

          build.onDispose(async () => {
            await currentEsbuildContext?.context.dispose();
          });
        },
      });

      build.register({
        type: 'asset',
        setup: (build) => {
          build.onLoad({ filter }, async (args) => {
            const { specifier, loaded } = await config.loader.load(args);
            log(`found css entrypoint "${utils.name(specifier, config)}"`, {
              kind: 'debug',
              scope: 'plugin:style',
            });

            return { ...loaded, loader: 'css' };
          });
        },
      });

      build.onBuildAssets(async ({ getAssets }) => {
        log('bundling style entrypoints ', { scope: 'plugin:style' });
        const assets = getAssets('css');
        const facades = await generateFacades(assets, build.config);

        const context = await getContext(
          facades.map((facade) => path.fromFileUrl(facade.url)),
          build.config,
        );

        const result = await context.rebuild();

        return getCssBundle(
          result.metafile,
          facades,
          build.config,
        );
      });
    },
  };

  async function getContext(
    entrypoints: string[],
    config: Config,
  ): Promise<
    esbuild.BuildContext<
      Omit<esbuild.BuildOptions, 'metafile'> & { metafile: true }
    >
  > {
    const id = entrypoints.slice().sort().join('');
    if (currentEsbuildContext?.id !== id) {
      if (currentEsbuildContext !== undefined) {
        log(
          'script entrypoints list has changed, recreate esbuild context',
          { kind: 'debug', scope: 'plugin:style' },
        );

        await currentEsbuildContext.context.dispose();
      }
      currentEsbuildContext = {
        id,
        context: await setupContext(entrypoints, config),
      };
    }

    return currentEsbuildContext.context;
  }

  function setupContext(
    entrypoints: string[],
    config: Config,
  ): Promise<
    esbuild.BuildContext<
      Omit<esbuild.BuildOptions, 'metafile'> & { metafile: true }
    >
  > {
    const outdirURL = new URL(outdir, config.publicdir);
    const esbuildConfig: esbuild.BuildOptions = {
      ...config.esbuildOptions,
      target: config.esbuildOptions?.target === 'esnext'
        ? 'esnext'
        : ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      define: {
        ...config.esbuildOptions?.define,
        'import.meta.main': 'true',
      },
      loader: {
        ...config.esbuildOptions?.loader,
      },
      outdir: path.fromFileUrl(outdirURL),
      plugins: [
        ...(config.esbuildOptions?.plugins ?? []),
        ...(config.plugins.flatMap((plugin) => plugin.asset)),
        denoResolve({ config }),
        cleanOutdir(config),
        outputMetafile(config),
      ],
      format: 'esm',
      entryPoints: entrypoints,
      bundle: true,
      metafile: true,
      absWorkingDir: path.fromFileUrl(new URL('.', config.self)),
    };

    log(`asset esbuild config`, {
      kind: 'verbose',
      scope: 'plugin:style',
      extra: JSON.stringify(esbuildConfig),
    });

    return esbuild.context(esbuildConfig);
  }
}

type Facade = { entrypoint: string; url: URL; content: string[] };

async function generateFacades(assets: Asset[], config: Config) {
  const facadesMap: Record<string, Facade> = {};

  for (const asset of assets) {
    const entrypoint = asset.outputEntryPoint.entryPoint;
    const facadePath = path.join(
      'asset',
      'style',
      path.dirname(entrypoint),
      `${path.basename(entrypoint, path.extname(entrypoint))}.css`,
    );
    const facadeUrl = new URL(facadePath, config.cachedir);
    const facadeContent = `@import "${
      asset.url.protocol === 'file:'
        ? path.fromFileUrl(asset.url)
        : asset.url.href
    }";`;
    facadesMap[entrypoint] = facadesMap[entrypoint] ?? {
      entrypoint,
      url: facadeUrl,
      content: [],
    };
    facadesMap[entrypoint].content.push(facadeContent);
  }

  const facades = Object.values(facadesMap);

  await Promise.all(
    facades.map(async (facade) => {
      await fs.ensureFile(facade.url);
      await Deno.writeTextFile(facade.url, facade.content.join('\n'));
    }),
  );

  return facades;
}

function getCssBundle(
  metafile: esbuild.Metafile,
  facades: Facade[],
  config: Config,
) {
  const generated: Record<string, string> = {};

  const outputs = Object.entries(metafile.outputs);

  for (const [outputPath, output] of outputs) {
    if (output.entryPoint === undefined) {
      continue;
    }

    const outputEntrypointUrl = new URL(output.entryPoint, config.self);

    const facade = facades.find(
      (facade) => facade.url.href === outputEntrypointUrl.href,
    );

    if (facade === undefined) {
      continue;
    }

    const cssBundleUrl = new URL(outputPath, config.self);
    const bundleName = path.relative(
      path.fromFileUrl(config.publicdir),
      path.fromFileUrl(cssBundleUrl),
    );
    const bundleSize = utils.getBundleSize(metafile, outputPath);
    const bundleLimit = config.budget.get('style');

    utils.logBundleSize(
      bundleSize,
      config,
      bundleName,
      bundleLimit,
      'plugin:style',
    );

    generated[facade.entrypoint] = `/${bundleName}`;
  }

  return generated;
}
