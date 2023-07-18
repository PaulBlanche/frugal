import { Config } from "../../../../mod.ts";
import { css } from "../../../../plugins/css.ts";
import { cssModule } from "../../../../plugins/cssModule.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page.ts"],
    plugins: [cssModule(), css()],
    log: { level: "silent" },
};
