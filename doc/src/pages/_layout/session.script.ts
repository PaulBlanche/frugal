import { BrowserSession } from "$dep/frugal/runtime/session.ts";

if (import.meta.environment === "client") {
    BrowserSession.init();
}
