import { Config, NginxExporter } from "../../mod.ts";
import { script } from "../../plugins/script.ts";
import { solidjs } from "../../plugins/solidjs.ts";

export default {
    self: import.meta.url,
    pages: [
        "./page.ts",
    ],
    importMap: "./import_map.json",
    esbuild: {
        minify: false,
        sourcemap: "external",
    },
    plugins: [solidjs(), script()],
    exporter: new NginxExporter(),
} as Config;
