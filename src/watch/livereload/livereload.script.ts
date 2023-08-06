import { LiveReloadClient } from "./LiveReloadClient.ts";
import "./types.ts";

console.log(window.__FRUGAL__DEV__LIVRERELOAD);

if (window.__FRUGAL__DEV__LIVRERELOAD === undefined) {
    const url = new URL("/", location.href);
    url.port = "4075";
    window.__FRUGAL__DEV__LIVRERELOAD = new LiveReloadClient(url.href);
}
