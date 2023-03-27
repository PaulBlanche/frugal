/* this file was generated, do not edit it ! */
import config from "../frugal.config.ts";
import * as frugal from "../../src/Frugal.ts"
import * as page_d19517d0d2c39879 from "./../dist/.cache/build/mod.js";
export const assets = {"svg":["/svg/illustrations.svg"],"script":{"src/pages/home/mod.ts":"/js/mod.js"},"style":{"src/pages/home/mod.ts":"/css/mod.css"}}
export const configHash = "eba21cf7786d7b6b"
export const routablePages = [{ descriptor : page_d19517d0d2c39879, name: "src/pages/home/mod.ts", hash: "d19517d0d2c39879" }];
export async function serve() {
    const instance = new frugal.Frugal(config);
    instance.config.setHash(configHash)
    await instance._serve({ routablePages, assets })
}
