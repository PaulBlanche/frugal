import { build } from "../../packages/core/mod.ts";
import * as path from "../../dep/std/path.ts";

const ROOT = path.dirname(new URL(import.meta.url).pathname);

build({
  root: ROOT,
  outputDir: "./dist",
  pages: [
    "./page.ts",
  ],
});
