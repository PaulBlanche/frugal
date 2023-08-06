import { LiveReloadClient } from "./LiveReloadClient.ts";

declare global {
    namespace globalThis {
        // deno-lint-ignore no-var
        var __FRUGAL__DEV__LIVRERELOAD: LiveReloadClient;
    }
}
