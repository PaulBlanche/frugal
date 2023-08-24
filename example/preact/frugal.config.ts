import { Config, NginxExporter } from "../../mod.ts";
import { script } from "../../plugins/script.ts";

export default {
    self: import.meta.url,
    pages: [
        "./page/page1/mod.ts",
        "./page/page2/mod.ts",
    ],
    importMap: "./import_map.json",
    esbuild: {
        jsx: "automatic",
        jsxImportSource: "preact",
        splitting: true,
    },
    plugins: [script()],
    exporter: new NginxExporter(),
} as Config;
