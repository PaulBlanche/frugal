export const TOGGLE_ID = "site-nav-toggle";
export const DRAWER_ID = "site-nav-drawer";
export const OVERLAY_ID = "site-nav-overlay";
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
    const select = document.getElementById(VERSION_SELECT_ID) as HTMLSelectElement;

    if (!toggle || !drawer || !overlay || !select) {
        return;
    }

    if (!REGISTERED.has(toggle)) {
        toggle.addEventListener("click", () => {
            drawer.toggleAttribute("data-open");
            document.body.classList.toggle("no-scroll");
        });
        REGISTERED.add(toggle);
    }

    if (!REGISTERED.has(overlay)) {
        overlay.addEventListener("click", () => {
            drawer.toggleAttribute("data-open");
            document.body.classList.toggle("no-scroll");
        });
        REGISTERED.add(overlay);
    }

    if (!REGISTERED.has(select)) {
        select.addEventListener("change", () => {
            const target = location.href.replace(/\/doc@\d+(\.\d+)*/, `/doc@${select.value}/`);
            Session.navigate(target);
        });
        REGISTERED.add(select);
    }
}
