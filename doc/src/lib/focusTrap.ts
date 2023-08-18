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
