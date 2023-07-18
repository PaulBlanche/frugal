import { Config } from "../../../../mod.ts";
import { css } from "../../../../plugins/css.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page.ts"],
    plugins: [css()],
    log: { level: "silent" },
};
