import * as frugal from "http://0.0.0.0:8000/mod.ts";
import { script } from "http://0.0.0.0:8000/plugins/script.ts";

export default /** @type {frugal.Config} */ {
    self: import.meta.url,
    pages: ["./page/page.ts"],
    // we want frugal to bundle client scripts
    plugins: [script({ denoConfig: "./deno.json" })],
    log: {
        level: "verbose",
    },
    // we want frugal to export a static website.
    exporter: new frugal.NginxExporter(),
};
