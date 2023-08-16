import * as colors from "../../../dep/std/fmt/colors.ts";
import * as fs from "../../../dep/std/fs.ts";
import * as path from "../../../dep/std/path.ts";

import versions from "../../../versions.json" assert { type: "json" };
import { getConfig } from "./config.ts";
import * as files from "./files.ts";

console.log(colors.gray(`frugal version ${versions[0]}`));

const config = getConfig(Deno.args);

console.log("");
console.log(colors.bold("Configuring project"));
console.log(`  root: ${colors.bold(config.root)}${config.force ? " (force overwrite)" : ""}`);
console.log(`  export: ${colors.bold(config.exportType)}`);
console.log(`  cache: ${colors.bold(config.cacheType)}`);
console.log(`  framework: ${colors.bold(config.framework)}`);

await fs.ensureDir(config.root);
if (config.force) {
    await fs.emptyDir(config.root);
}

await safeWriteTextFile(
    path.resolve(config.root, "deno.json"),
    files.denoConfig(config),
);
await safeWriteTextFile(
    path.resolve(config.root, "import_map.json"),
    files.importMap(config),
);
await safeWriteTextFile(
    path.resolve(config.root, "frugal.config.ts"),
    files.frugalConfig(config),
);
await Promise.all(
    files.helloWorldPage(config).map(async (file) => {
        await safeWriteTextFile(path.resolve(config.root, file.path), file.content);
    }),
);
await safeWriteTextFile(
    path.resolve(config.root, "watch.ts"),
    files.watchScript(),
);
await safeWriteTextFile(
    path.resolve(config.root, "build.ts"),
    files.buildScript(),
);

async function safeWriteTextFile(path: string, content: string) {
    await fs.ensureFile(path);
    await Deno.writeTextFile(path, content);
}
