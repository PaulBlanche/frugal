import { BrowserSession } from "../../../../../runtime/session.ts";

if (import.meta.main) {
    BrowserSession.init();
    dispatchEvent(
        new CustomEvent("frugal:sessionstart"),
    );
    console.log("start");
}
