import { BrowserSession } from "$dep/frugal/runtime/session.ts";
import { FocusTrap } from "$dep/frugal/doc/src/client/focusTrap.ts";

export const TOGGLE_ID = "site-nav-toggle";
export const DRAWER_ID = "site-nav-drawer";
export const OVERLAY_ID = "site-nav-overlay";
export const NAV_ID = "site-nav-nav";
export const VERSION_SELECT_ID = "version-select";

const REGISTERED = new WeakSet();

if (import.meta.main) {
    setup();

    addEventListener("frugal:readystatechange", (event) => {
        if (event.detail.readystate === "complete") {
            setup();
        }
    });
}

function setup() {
    const toggle = document.getElementById(TOGGLE_ID);
    const drawer = document.getElementById(DRAWER_ID);
    const overlay = document.getElementById(OVERLAY_ID);
    const nav = document.getElementById(NAV_ID);
    const select = document.getElementById(VERSION_SELECT_ID) as HTMLSelectElement;

    if (toggle && drawer && nav && !REGISTERED.has(toggle)) {
        nav.toggleAttribute("aria-hidden");
        toggle.addEventListener("click", () => {
            drawer.toggleAttribute("data-open");
            nav.toggleAttribute("aria-hidden");
            document.body.classList.toggle("no-scroll");
            FocusTrap.toggle(drawer, {});
        });
        toggle.toggleAttribute("data-drawer", true);
        drawer.toggleAttribute("data-drawer", true);
        REGISTERED.add(toggle);
    }

    if (overlay && drawer && !REGISTERED.has(overlay)) {
        overlay.addEventListener("click", () => {
            drawer.toggleAttribute("data-open");
            document.body.classList.toggle("no-scroll");
        });
        REGISTERED.add(overlay);
    }

    if (select && !REGISTERED.has(select)) {
        select.addEventListener("change", () => {
            const target = location.href.replace(/\/doc@\d+(\.\d+)*/, `/doc@${select.value}/`);
            BrowserSession.navigate(target);
        });
        REGISTERED.add(select);
    }
}
