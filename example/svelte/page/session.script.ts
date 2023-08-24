import { BrowserSession } from "../../../runtime/session.ts";

if (import.meta.environment === "client") {
    BrowserSession.init();
}
