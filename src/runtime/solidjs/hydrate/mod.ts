import type { GetApp, HydrationStrategy } from "../types.ts";
import { hydrateIsland } from "./hydrateIsland.tsx";

export function hydrate<PROPS>(name: string, getApp: GetApp<PROPS>) {
    onRetroactiveReadyStateChange("complete", hydrateAll);

    function hydrateAll() {
        const hydratableOnLoad = queryHydratables(name, "load");
        if (hydratableOnLoad.length !== 0) {
            hydrateOnLoad(hydratableOnLoad, getApp);
        }

        const hydratableOnVisible = queryHydratables(name, "visible");
        if (hydratableOnVisible.length !== 0) {
            hydrateOnVisible(hydratableOnVisible, getApp);
        }

        const hydratableOnIdle = queryHydratables(name, "idle");
        if (hydratableOnIdle.length !== 0) {
            hydrateOnIdle(hydratableOnIdle, getApp);
        }

        const hydratableOnMediaQuery = queryHydratables(name, "media-query");
        if (hydratableOnMediaQuery.length !== 0) {
            hydrateOnMediaQuery(hydratableOnMediaQuery, getApp);
        }
    }
}

export function queryHydratables(
    name: string,
    strategy: HydrationStrategy,
): NodeListOf<HTMLScriptElement> {
    return document.querySelectorAll(
        `script[data-hydratable="${name}"][data-hydration-strategy="${strategy}"]`,
    );
}

// hydrate immediatly
function hydrateOnLoad<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    Array.from(hydratables).map(async (script) => {
        hydrateIsland(script, await getApp());
    });
}

// hydrate as soon as the main thread is idle
function hydrateOnIdle<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    if (typeof requestIdleCallback === "undefined") {
        setTimeout(() => {
            Array.from(hydratables).map(async (script) => {
                hydrateIsland(script, await getApp());
            });
        }, 1);
    } else {
        requestIdleCallback(() => {
            Array.from(hydratables).map(async (script) => {
                hydrateIsland(script, await getApp());
            });
        });
    }
}

// hydrate when the island enters the screen
function hydrateOnVisible<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.map(async (entry) => {
            if (
                entry.isIntersecting &&
                entry.target.previousElementSibling instanceof HTMLScriptElement
            ) {
                hydrateIsland(entry.target.previousElementSibling, await getApp());
                observer.unobserve(entry.target);
            }
        });
    });

    hydratables.forEach((script) => {
        script.nextElementSibling && observer.observe(script.nextElementSibling);
    });
}

// hydrate on load if a media queries matches
function hydrateOnMediaQuery<PROPS>(
    hydratables: NodeListOf<HTMLScriptElement>,
    getApp: GetApp<PROPS>,
) {
    Array.from(hydratables).map(async (root) => {
        const query = root.dataset["hydrationQuery"];
        if (query && matchMedia(query)) {
            hydrateIsland(root, await getApp());
        }
    });
}

const readyStateOrder: Record<DocumentReadyState, number> = {
    "loading": 0,
    "interactive": 1,
    "complete": 2,
};

export function onRetroactiveReadyStateChange(
    readyState: DocumentReadyState,
    callback: () => void,
) {
    if (readyStateOrder[document.readyState] >= readyStateOrder[readyState]) {
        callback();
    } else {
        document.addEventListener("readystatechange", () => {
            if (document.readyState === readyState) {
                callback();
            }
        });
    }

    addEventListener(
        "frugal:readystatechange",
        (event) => {
            if (event.detail.readystate === readyState) {
                callback();
            }
        },
    );
}
