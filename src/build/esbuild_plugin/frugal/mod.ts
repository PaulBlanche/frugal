import * as esbuild from '../../../../dep/esbuild.ts';
import * as fs from '../../../../dep/std/fs.ts';
import * as path from '../../../../dep/std/path.ts';

import { Config } from '../../../Config.ts';
import { ContentBuilder } from './ContentBuilder.ts';
import { AssetBuilder } from './AssetBuilder.ts';

export type FrugalOptions = {
  config: Config;
  isExport?: boolean;
};

export function frugal({ config, isExport }: FrugalOptions): esbuild.Plugin {
  return {
    name: 'frugal',
    setup(build) {
      build.onEnd(async (result) => {
        const metafile = result.metafile;
        const errors = result.errors;

        if (errors.length !== 0 || metafile === undefined) {
          return;
        }

        const assetBuilder = new AssetBuilder(metafile, config);
        const assets = await assetBuilder.build();

        try {
          const builder = new ContentBuilder(metafile, config);
          const pages = await builder.build(assets, isExport);

          const imports = [
            `/* this file was generated, do not edit it ! */`,
            `import config from "${
              path.relative(
                path.fromFileUrl(config.clidir),
                path.fromFileUrl(config.self),
              )
            }";`,
            `import * as frugal from "${
              new URL(import.meta.url).protocol === 'file:'
                ? path.relative(
                  path.fromFileUrl(config.clidir),
                  path.fromFileUrl(
                    new URL('../../../../mod.ts', import.meta.url),
                  ),
                )
                : new URL('../../../../mod.ts', import.meta.url).href
            }"`,
          ];
          const statements = [
            `export const assets = ${JSON.stringify(assets)}`,
            `export const configHash = "${await config.hash}"`,
          ];
          const pagesExport = [];

          for (const page of pages) {
            imports.push(
              `import * as page_${page.hash} from "./${
                path.relative(
                  path.fromFileUrl(config.clidir),
                  path.fromFileUrl(page.descriptor.self),
                )
              }#${page.hash}";`,
            );
            pagesExport.push(
              `{ descriptor : page_${page.hash} as any, name: "${page.name}", hash: "${page.hash}" }`,
            );
          }

          statements.push(
            `export const routablePages = [${pagesExport.join(',')}];`,
          );

          statements.push(...[
            `export async function serve(options?: frugal.ServeOptions) {
    const instance = new frugal.Frugal(config);
    instance.config.setHash(configHash)
    await instance.serve({ routablePages, assets, ...options })
}
`,
          ]);

          const serverScript = `${imports.join('\n')}\n${
            statements.join('\n')
          }`;

          const serveScriptURL = config.isDevMode
            ? new URL('_devserver.ts', config.clidir)
            : new URL('_server.ts', config.clidir);
          await fs.ensureFile(serveScriptURL);
          await Deno.writeTextFile(serveScriptURL, serverScript);
        } catch (e) {
          console.log(e);
          throw e;
        }
      });
    },
  };
}
