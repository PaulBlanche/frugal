import { Config } from "../../../../mod.ts";
import { css } from "../../../../plugins/css.ts";
import { cssModule } from "../../../../plugins/cssModule.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page.ts"],
    plugins: [
        cssModule({
            // to avoid hash beeing different on different machines runing the
            // tests
            pattern: "[local]",
        }),
        css(),
    ],
    log: { level: "silent" },
};
