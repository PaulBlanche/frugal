import { LiveReloadClient } from "./LiveReloadClient.js";

if (window.__FRUGAL__DEV__LIVRERELOAD === undefined) {
    const url = new URL("/", location.href);
    url.port = "4075";
    window.__FRUGAL__DEV__LIVRERELOAD = new LiveReloadClient(url.href);
}
