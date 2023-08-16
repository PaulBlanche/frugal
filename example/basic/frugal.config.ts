import { Config } from "../../mod.ts";
import { ApacheExporter } from "../../src/export/ApacheExporter.ts";
import { script } from "../../src/plugin/script.ts";

export default {
    self: import.meta.url,
    pages: [
        "./page/page.ts",
    ],
    log: {
        level: "verbose",
    },
    esbuild: {
        splitting: true,
    },
    plugins: [script({
        filter: /\.(min|script)\.[tj]sx?$/,
    })],
    exporter: ApacheExporter.export,
} satisfies Config;
