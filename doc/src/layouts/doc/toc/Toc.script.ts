import { Session } from "$dep/frugal/runtime/session.ts";

export const TOGGLE_ID = "site-nav-toggle";
export const DRAWER_ID = "site-nav-drawer";
export const OVERLAY_ID = "site-nav-overlay";
export const VERSION_SELECT_ID = "version-select";

if (import.meta.main) {
    const toggle = document.getElementById(TOGGLE_ID)!;
    const drawer = document.getElementById(DRAWER_ID)!;
    const overlay = document.getElementById(OVERLAY_ID)!;

    toggle.addEventListener("click", () => {
        drawer.toggleAttribute("data-open");
        document.body.classList.toggle("no-scroll");
    });

    overlay.addEventListener("click", () => {
        drawer.toggleAttribute("data-open");
        document.body.classList.toggle("no-scroll");
    });

    const versionSelect = document.getElementById(VERSION_SELECT_ID)! as HTMLSelectElement;

    versionSelect.addEventListener("change", () => {
        Session.navigate(location.href.replace(/\/doc@.*?\//, `/doc@${versionSelect.value}/`));
    });
}
