import { Config, NginxExporter } from "../../mod.ts";
import { svelte } from "../../plugins/svelte.ts";
import { script } from "../../plugins/script.ts";

export default {
    pages: ["./page/page1/mod.ts", "./page/page2/mod.ts"],
    self: import.meta.url,
    importMap: "./import_map.json",
    plugins: [
        svelte(),
        script(),
    ],
    esbuild: {
        splitting: true,
    },
    exporter: new NginxExporter(),
} satisfies Config;
