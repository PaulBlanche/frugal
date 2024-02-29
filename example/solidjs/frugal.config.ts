import { Config, NginxExporter } from "../../mod.ts";
import { script } from "../../plugins/script.ts";
import { solidjs } from "../../plugins/solidjs.ts";

export default {
    self: import.meta.url,
    pages: [
        "./page/page1/mod.ts",
        "./page/page2/mod.ts",
    ],
    importMap: "./import_map.json",
    esbuild: {
        minify: false,
        splitting: true,
        sourcemap: "external",
    },
    plugins: [solidjs(), script()],
    exporter: new NginxExporter(),
} as Config;
