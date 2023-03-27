/* this file was generated, do not edit it ! */
import config from "../frugal.config.ts";
import * as frugal from "../../mod.ts"
import * as page_c52179725f6fb91a from "./../dist/.cache/build/mod.js";
export const assets = {"svg":["/svg/illustrations.svg"],"script":{"src/pages/home/mod.ts":"/js/mod.js"},"style":{"src/pages/home/mod.ts":"/css/mod.css"}}
export const configHash = "d14812a621ec37e7"
export const routablePages = [{ descriptor : page_c52179725f6fb91a, name: "src/pages/home/mod.ts", hash: "c52179725f6fb91a" }];
export async function serve(options?: frugal.ServeOptions) {
    const instance = new frugal.Frugal(config);
    instance.config.setHash(configHash)
    await instance._serve({ routablePages, assets, ...options })
}
