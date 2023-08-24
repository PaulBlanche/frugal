import { Config, NginxExporter } from "../../mod.ts";
import { script } from "../../src/plugin/script.ts";

export default {
    self: import.meta.url,
    pages: [
        "./page/page.ts",
    ],
    // we want frugal to bundle client scripts
    plugins: [script()],
    // we want frugal to export a static website.
    exporter: new NginxExporter(),
} satisfies Config;
