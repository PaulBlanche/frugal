import globalStyle from "https://cdn.skypack.dev/svelte-preprocess@5.0.3/dist/processors/globalStyle";
import { Config, NginxExporter } from "../../mod.ts";
import { svelte } from "../../plugins/svelte.ts";
import { script } from "../../plugins/script.ts";

export default {
    pages: ["./home.ts", "./home2.ts"],
    self: import.meta.url,
    importMap: "../../import_map.json",
    plugins: [
        svelte({
            preprocess: globalStyle(),
        }),
        script(),
    ],
    log: {
        level: "verbose",
    },
    esbuild: {
        splitting: true,
    },
    exporter: NginxExporter.export,
} satisfies Config;
