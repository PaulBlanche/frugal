import { BrowserSession } from "$dep/frugal/runtime/session.ts";

if (import.meta.main) {
    BrowserSession.init();
}
