import * as frugal from "frugal";
import { script } from "frugal/plugins/script";
import { cssModule } from "frugal/plugins/cssModule";

const a = new frugal.NginxExporter();

export default /** @type {frugal.Config} */ ({
    self: import.meta.url,
    pages: ["./page/page.ts"],
    // we want frugal to bundle client scripts
    plugins: [script(), cssModule()],
    log: {
        level: "verbose",
    },
    // we want frugal to export a static website.
    exporter: a,
});
