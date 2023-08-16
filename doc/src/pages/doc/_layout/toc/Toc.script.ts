import { BrowserSession } from "$dep/frugal/runtime/session.ts";

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

const FOCUSABLE_ELEMENTS = [
    "a[href]",
    "area[href]",
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
    "select:not([disabled]):not([aria-hidden])",
    "textarea:not([disabled]):not([aria-hidden])",
    "button:not([disabled]):not([aria-hidden])",
    "iframe",
    "object",
    "embed",
    "[contenteditable]",
    '[tabindex]:not([tabindex^="-"])',
];

type FocusTrapConfig = {
    focusable?: string;
    initialFocusExclude?: string;
};

export class FocusTrap {
    #activeTrap?: Trap;

    static _instance?: FocusTrap;

    static get active() {
        return FocusTrap._instance?.active ?? false;
    }

    static toggle(element: HTMLElement, config: FocusTrapConfig) {
        if (FocusTrap.active) {
            FocusTrap.deactivate();
        } else {
            FocusTrap.activate(element, config);
        }
    }

    static activate(element: HTMLElement, config: FocusTrapConfig) {
        if (FocusTrap._instance === undefined) {
            FocusTrap._instance = new FocusTrap();
        }

        FocusTrap._instance.activate(element, config);
    }

    static deactivate() {
        FocusTrap._instance?.deactivate();
    }

    get active() {
        return this.#activeTrap !== undefined;
    }

    activate(element: HTMLElement, config: FocusTrapConfig) {
        if (this.#activeTrap !== undefined) {
            throw Error("a focus trap is already activated");
        }
        this.#activeTrap = new Trap(element, config);
        this.#activeTrap.activate();
    }

    deactivate() {
        if (this.#activeTrap !== undefined) {
            this.#activeTrap.deactivate();
            this.#activeTrap = undefined;
        }
    }
}

class Trap {
    #config: FocusTrapConfig;
    #root: HTMLElement;
    #deactivate?: () => void;

    constructor(root: HTMLElement, config: FocusTrapConfig) {
        this.#config = config;
        this.#root = root;
    }

    #queryFocusable() {
        return this.#root.querySelectorAll<HTMLElement>(this.#config.focusable ?? FOCUSABLE_ELEMENTS.join(","));
    }

    #focusFirstElement() {
        for (const element of this.#queryFocusable()) {
            if (this.#config.initialFocusExclude && element.matches(this.#config.initialFocusExclude)) {
                return;
            }
            element.focus();
            return;
        }
    }

    activate() {
        const previouslyFocused = document.activeElement;
        this.#focusFirstElement();
        const handler = (event: KeyboardEvent) => {
            this.#handleTrappedTab(event);
        };
        document.addEventListener("keydown", handler);

        this.#deactivate = () => {
            if (previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus();
            }
            document.removeEventListener("keydown", handler);
        };
    }

    deactivate() {
        if (this.#deactivate) {
            this.#deactivate();
        }
    }

    #handleTrappedTab(event: KeyboardEvent) {
        // only handle tab
        if (!(event.key === "Tab" || event.keyCode === 9)) {
            return;
        }

        const focusable = this.#queryFocusable();

        if (focusable.length === 0) {
            return;
        }

        const index = getFocusedIndex(focusable);

        if (event.shiftKey && index === 0) {
            focusable.item(focusable.length - 1).focus();
            event.preventDefault();
        }

        if (!event.shiftKey && focusable.length > 0 && index === focusable.length - 1) {
            focusable.item(0).focus();
            event.preventDefault();
        }
    }
}

function getFocusedIndex(focusable: NodeListOf<Element>) {
    let index = -1;
    for (const element of focusable) {
        index++;
        if (element === document.activeElement) {
            return index;
        }
    }
}
