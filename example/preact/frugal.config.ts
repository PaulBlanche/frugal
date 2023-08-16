import { Config, NginxExporter } from "../../mod.ts";
import { script } from "../../plugins/script.ts";

export default {
    self: import.meta.url,
    pages: ["./page1.ts", "./page2.ts"],
    log: {
        level: "verbose",
    },
    importMap: "../../import_map.json",
    esbuild: {
        jsx: "automatic",
        jsxImportSource: "preact",
        splitting: true,
    },
    plugins: [script()],
    exporter: NginxExporter.export,
} as Config;
