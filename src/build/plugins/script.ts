import * as path from '../../../dep/std/path.ts';
import * as fs from '../../../dep/std/fs.ts';
import * as esbuild from '../../../dep/esbuild.ts';

import { Asset, Plugin, RegisteredPlugin } from '../../Plugin.ts';
import { Config } from '../../Config.ts';
import { cleanOutdir } from '../esbuild_plugin/cleanOutdir.ts';
import { outputMetafile } from '../esbuild_plugin/outputMetafile.ts';
import { denoResolve } from '../esbuild_plugin/denoResolve.ts';
import { log } from '../../log.ts';
import * as utils from './utils.ts';

type ScriptOptions = {
  outdir: string;
  filter: RegExp;
};

type Cache = { id: string; context: esbuild.BuildContext } | undefined;

export function script(
  { outdir = 'js/', filter = /\.script.[tj]sx?$/ }: Partial<ScriptOptions> = {},
): Plugin {
  let cache: Cache = undefined;

  return {
    name: 'script',
    create(build) {
      build.includeAsset({ type: 'script', filter });

      build.register(
        esbuildScriptPlugin({
          mode: 'server',
          filter,
          config: build.config,
          cache,
        }),
      );

      build.register(
        esbuildScriptPlugin({
          mode: 'asset',
          filter,
          config: build.config,
          cache,
        }),
      );

      build.onBuildAssets(async ({ getAssets }) => {
        log('bundling script entrypoints ', { scope: 'plugin:script' });
        const assets = getAssets('script');

        const facades = await generateFacades(assets, build.config);

        const context = await getContext(
          facades.map((facade) => path.fromFileUrl(facade.url)),
          build.config,
        );

        const result = await context.rebuild();

        return getJsBundle(
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
    if (cache?.id !== id) {
      if (cache !== undefined) {
        log(
          'script entrypoints list has changed, recreate esbuild context',
          { kind: 'debug', scope: 'plugin:script' },
        );

        await cache.context.dispose();
      }
      cache = { id, context: await setupContext(entrypoints, config) };
    }

    return cache.context;
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
      scope: 'plugin:script',
      extra: JSON.stringify(esbuildConfig),
    });

    return esbuild.context(esbuildConfig);
  }
}

type ServeScriptOptions = {
  mode: 'server' | 'asset';
  filter: RegExp;
  config: Config;
  cache: Cache;
};

function esbuildScriptPlugin(
  { filter, config, cache, mode }: ServeScriptOptions,
): RegisteredPlugin {
  return {
    type: mode,
    setup(build) {
      build.onLoad({ filter }, async (args) => {
        const { specifier, loaded } = await config.loader.load(args);

        const url = new URL(specifier);
        log(
          `found script entrypoint "${
            url.protocol === 'file:'
              ? path.relative(
                path.fromFileUrl(new URL('.', config.self)),
                path.fromFileUrl(url),
              )
              : url.href
          }"`,
          {
            kind: 'debug',
            scope: 'plugin:script',
          },
        );

        return { ...loaded, loader: 'js' };
      });

      if (mode === 'server') {
        build.onDispose(async () => {
          await cache?.context.dispose();
        });
      }
    },
  };
}

type Facade = { entrypoint: string; url: URL; content: string[] };

async function generateFacades(assets: Asset[], config: Config) {
  const facadesMap: Record<string, Facade> = {};

  for (const asset of assets) {
    const entrypoint = asset.outputEntryPoint.entryPoint;
    const facadePath = path.join('asset', 'script', entrypoint);
    const facadeUrl = new URL(facadePath, config.cachedir);
    const facadeContent = `import "${path.fromFileUrl(asset.url)}";`;
    facadesMap[entrypoint] = facadesMap[entrypoint] ?? {
      entrypoint,
      url: facadeUrl,
      content: [],
    };
    facadesMap[entrypoint].content.push(facadeContent);
  }

  const facades = Object.values(facadesMap);

  if (config.isDevMode) {
    sideLoad(facades, ['../../livereload/livereload.script.ts']);
  }

  await Promise.all(
    facades.map(async (facade) => {
      await fs.ensureFile(facade.url);
      await Deno.writeTextFile(facade.url, facade.content.join('\n'));
    }),
  );

  return facades;
}

function sideLoad(facades: Facade[], scripts: string[]) {
  for (const script of scripts) {
    const liveReloadUrl = new URL(
      script, //,
      import.meta.url,
    );
    facades.forEach((facade) => {
      facade.content.push(
        `import "${path.fromFileUrl(liveReloadUrl)}";`,
      );
    });
  }
}

function getJsBundle(
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

    const jsBundleUrl = new URL(outputPath, config.self);
    const bundleName = path.relative(
      path.fromFileUrl(config.publicdir),
      path.fromFileUrl(jsBundleUrl),
    );
    const bundleSize = utils.getBundleSize(metafile, outputPath);
    const bundleLimit = config.budget.get('script');

    utils.logBundleSize(
      bundleSize,
      config,
      bundleName,
      bundleLimit,
      'plugin:script',
    );

    generated[facade.entrypoint] = `/${bundleName}`;
  }

  return generated;
}

export function getLoadSpecifier(args: esbuild.OnLoadArgs) {
  if (args.namespace === 'file') {
    return path.toFileUrl(args.path).href;
  } else {
    return `${args.namespace}:${args.path}`;
  }
}
