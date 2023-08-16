import { Config } from "../../../../../mod.ts";
import { script } from "../../../../../plugins/script.ts";
import { NginxExporter } from "../../../../../src/export/NginxExporter.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page1.ts", "./page2.ts", "./page3.ts", "./page4.ts"],
    plugins: [
        script(),
    ],
    esbuild: {
        splitting: true,
    },
    log: { level: "silent" },
    exporter: NginxExporter.export,
};
