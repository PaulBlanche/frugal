import { Config, importKey, NginxExporter } from "./dep/frugal.ts";
import { css, cssModule, script, svg } from "./dep/frugal/plugins.ts";

export default {
    self: import.meta.url,
    importMap: "./import_map.json",
    pages: [
        "./page/home/mod.ts",
    ],
    log: {
        level: "verbose",
    },
    esbuild: {
        splitting: true,
        jsx: "automatic",
        jsxImportSource: "preact",
    },
    plugins: [
        script(),
        cssModule(),
        css(),
        svg(),
    ],
    server: {
        port: 8001,
        cryptoKey: await importKey(
            "eyJrdHkiOiJvY3QiLCJrIjoiV2w0cEdjMjQyU1d4U0FneDVFZ1hMMWh4Z19OMEVMQWNfdmdxZ0ZUNDRXV19fbTlDRkZWMlBSNUVYa2R2dXNfX1pzUjRWbURxNG1xcWdYNC1KX3lmY0xTcXUzVllvNHdYRE92dXQtOFNEb0J6NG9YemFCU0NQYmtLVXFyeV90MjdMSkZsd1FMMGVVLTM2SzhCZm9SLVZZbm04bUJvbllZdUJFVTVsd3ZlbFd3IiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
        ),
    },
    exporter: NginxExporter.export,
} satisfies Config;
