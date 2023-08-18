import { Config } from "../../../../mod.ts";

export const config: Config = {
    self: import.meta.url,
    outdir: "./dist/",
    pages: ["./page1.ts", "./page2.ts"],
    log: { level: "silent" },
    cleanAll: false,
};
