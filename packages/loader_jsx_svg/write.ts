import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";

import * as svg from "./svg-sprite.ts";

export async function write(
  svgFiles: Record<string, svg.SVGFile>,
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
