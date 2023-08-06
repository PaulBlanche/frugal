import { LiveReloadClient } from "./LiveReloadClient.ts";

if (import.meta.main) {
    const a = new URL("/", location.href);
    a.port = "4075";
    new LiveReloadClient(a.href);
}
