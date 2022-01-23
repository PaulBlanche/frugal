import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";
import * as murmur from "../murmur/mod.ts";

import * as frugal from "../core/mod.ts";
import { SVGFile } from "./svg-sprite.ts";

type Config = {
  test: RegExp;
  jsx: Function;
  render: Function;
};

export function svg(config: Config): frugal.Loader<void, void> {
  return {
    name: "jsx-svg",
    test: config.test,
    generate,
  };

  function generate(
    { cache, assets, dir }: frugal.GenerateParams<void>,
  ): Promise<void> {
    const bundleHash = assets.reduce((hash, asset) => {
      return hash.update(asset.hash);
    }, new murmur.Hash()).alphabetic();

    return cache.memoize({
      key: bundleHash,
      producer: async () => {
        const svgModule = path.resolve(
          path.dirname(new URL(import.meta.url).pathname),
          "./svg-sprite.ts",
        );

        const svgGeneratorScript = `
import { output } from "file://${svgModule}";
${assets.map(({ module }) => `import "file://${module}";`).join("\n")}
export const output = output()`;

        const output = await import(
          URL.createObjectURL(new Blob([svgGeneratorScript]))
        );

        await write(output, dir.public, config.jsx, config.render);
      },
    });
  }
}

export async function write(
  svgFiles: Record<string, SVGFile>,
  publicDir: string,
  jsx: Function,
  render: Function,
) {
  await Promise.all(
    Object.values(svgFiles).map(async (svgFile) => {
      try {
        const svgContent = render(jsx(
          "svg",
          { xmlns: "http://www.w3.org/2000/svg" },
          jsx(
            "defs",
            {
              childre: svgFile.sprites.map((sprite) => {
                return jsx(
                  "g",
                  {
                    key: sprite.id,
                    id: sprite.id,
                    children: sprite.children,
                  },
                );
              }),
            },
          ),
        ));

        const svgPath = path.join(publicDir, svgFile.url);
        await fs.ensureDir(path.dirname(svgPath));
        await Deno.writeTextFile(svgPath, svgContent);
      } catch (e) {
        throw e;
      }
    }),
  );
}
