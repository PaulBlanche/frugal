import { LiveReloadClient } from "./LiveReloadClient.ts";
import "./types.ts";

if (window.__FRUGAL__DEV__LIVRERELOAD === undefined) {
    const url = new URL("/", location.href);
    url.port = "4075";
    window.__FRUGAL__DEV__LIVRERELOAD = new LiveReloadClient(url.href);
}
