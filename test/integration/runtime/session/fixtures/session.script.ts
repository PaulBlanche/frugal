import { Session } from "../../../../../runtime/session.ts";

if (import.meta.main) {
    addEventListener("beforeunload", () => console.log("beforeunload"));
    addEventListener("frugal:beforeunload", () => console.log("frugal:beforeunload"));
    addEventListener("frugal:readystatechange", (evt) => console.log("frugal:readystatechange", evt.detail.readystate));

    Session.init();
    dispatchEvent(
        new CustomEvent("frugal:sessionstart"),
    );
    console.log("start");
}
