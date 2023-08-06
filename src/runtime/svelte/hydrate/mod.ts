import type { GetApp, HydrationStrategy } from "../types.ts";
import { hydrateIsland } from "./hydrateIsland.ts";

export function hydrate(name: string, getApp: GetApp) {
    onRetroactiveReadyStateChange("complete", () => {
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
    });
}

export function queryHydratables(
    name: string,
    strategy: HydrationStrategy,
): NodeListOf<HTMLElement> {
    return document.querySelectorAll(
        `[data-hydratable="${name}"][data-hydration-strategy="${strategy}"]`,
    );
}

// hydrate immediatly
function hydrateOnLoad(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp,
) {
    Array.from(hydratables).map(async (root) => {
        hydrateIsland(root, await getApp());
    });
}

// hydrate as soon as the main thread is idle
function hydrateOnIdle(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp,
) {
    setTimeout(() => {
        Array.from(hydratables).map(async (root) => {
            hydrateIsland(root, await getApp());
        });
    }, 10);
}

// hydrate when the island enters the screen
function hydrateOnVisible(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp,
) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.map(async (entry) => {
            if (entry.isIntersecting && entry.target instanceof HTMLElement) {
                hydrateIsland(entry.target, await getApp());
                observer.unobserve(entry.target);
            }
        });
    });

    hydratables.forEach((root) => {
        observer.observe(root);
    });
}

// hydrate on load if a media queries matches
function hydrateOnMediaQuery(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp,
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
