import * as esbuild from '../../../../dep/esbuild.ts';
import * as XXH64 from '../../../../dep/xxhash.ts';
import * as importmap from '../../../../dep/importmap.ts';
import * as fs from '../../../../dep/std/fs.ts';

import { Config } from '../../../Config.ts';
import { log } from '../../../log.ts';
import { RoutablePage, Router } from '../../../page/Router.ts';
import { Assets } from '../../../page/PageDescriptor.ts';

type MetafileOutput = esbuild.Metafile['outputs'][string];

export class ContentBuilder {
  #metafile: esbuild.Metafile;
  #config: Config;

  constructor(
    metafile: esbuild.Metafile,
    config: Config,
  ) {
    this.#metafile = metafile;
    this.#config = config;
  }

  async build(assets: Assets, isExport?: boolean) {
    log('building contents', { scope: 'ContentBuilder' });
    const responseCache = await this.#config.responseCache('build');

    const pages: RoutablePage[] = [];

    try {
      await Promise.all(
        Object.entries(this.#metafile.outputs).map(
          async ([outputPath, output]) => {
            const routablePage = await this.#getRoutablePage(
              outputPath,
              output,
            );

            if (routablePage) {
              pages.push(routablePage);
            }
          },
        ),
      );

      const router = new Router(this.#config, responseCache);
      await router.setup({ pages, assets });

      await Promise.all(router.routes.map(async (route) => {
        if (route.type === 'static') {
          log(`building page descriptor ${route.name}`, {
            scope: 'ContentBuilder',
          });
          await route.builder.buildAll();
        }
      }));
    } catch (e) {
      log(e, { scope: 'ContentBuilder', kind: 'error' });
      throw e;
    }

    await responseCache.save();

    if (isExport) {
      log(`exporting html`, {
        scope: 'Frugal',
      });

      const pathnames = await responseCache.pathnames();
      await Promise.all(pathnames.map(async (pathname) => {
        const response = await responseCache.get(pathname);
        if (response && response.body !== undefined) {
          const fileUrl = new URL(
            `.${pathname}`,
            this.#config.publicdir,
          );
          await fs.ensureFile(fileUrl);
          await Deno.writeTextFile(fileUrl, response.body);
        }
      }));
    }

    return pages;
  }

  async #getRoutablePage(
    outputPath: string,
    output: MetafileOutput,
  ): Promise<RoutablePage | undefined> {
    if (!output.entryPoint) {
      return undefined;
    }

    log(`loading page descriptor "${output.entryPoint}"`, {
      scope: 'ContentBuilder',
    });

    const descriptorUrl = new URL(output.entryPoint, this.#config.self);

    const page = this.#config.pages.find((page) =>
      page.href === descriptorUrl.href
    );

    if (page === undefined) {
      return undefined;
    }

    const importMap = await this.#config.importMap;

    const dependencies: { path: string; url: URL }[] = [];

    dependencies.push({
      path: output.entryPoint,
      url: new URL(output.entryPoint, this.#config.self),
    });

    const seen = new Set();
    const queue = [...dependencies];
    let current: { path: string; url: URL } | undefined = undefined;
    while ((current = queue.pop()) !== undefined) {
      if (seen.has(current.path)) {
        continue;
      }
      seen.add(current.path);

      const input = this.#metafile.inputs[current.path];

      for (const imported of input.imports) {
        if (!imported.external && imported.original) {
          const parsed = parsePath(imported.path);
          if (parsed.namespace === 'virtual:') {
            continue;
          }
          const resolved = importMap
            ? new URL(importmap.resolveModuleSpecifier(
              parsed.path,
              importMap,
              this.#config.root,
            ))
            : new URL(parsed.path, this.#config.root);

          const dep = {
            path: imported.path,
            url: resolved,
          };
          dependencies.push(dep);
          queue.push(dep);
        }
      }
    }

    const xxhash = await XXH64.create();
    for (const dep of dependencies) {
      xxhash.update(await getDependencyContent(dep, this.#config));
    }

    const hash = xxhash.digest('hex') as string;

    const pageDescriptorUrl = new URL(outputPath, this.#config.self);
    if (this.#config.isDevMode) {
      pageDescriptorUrl.hash = hash;
    }

    log(
      `import page descriptor at`,
      {
        scope: 'ContentBuilder',
        kind: 'debug',
        extra: pageDescriptorUrl.href,
      },
    );

    return {
      hash,
      name: output.entryPoint,
      descriptor: await import(pageDescriptorUrl.href),
    };
  }
}

const ENCODER = new TextEncoder();

async function getDependencyContent(
  dep: { path: string; url: URL },
  config: Config,
) {
  if (dep.url.protocol === 'file:') {
    return await Deno.readFile(new URL(dep.url, config.root));
  }
  return ENCODER.encode(dep.url.href);
}

function parsePath(importPath: string) {
  try {
    const url = new URL(importPath);
    return {
      namespace: url.protocol,
      path: importPath,
    };
  } catch {
    return {
      path: `./${importPath}`,
    };
  }
}
