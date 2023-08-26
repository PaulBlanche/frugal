import type { HydrationStrategy } from "./types.ts";

type HydrateOptions = {
    hydrate: (root: HTMLElement) => Promise<void>;
    observable: (root: HTMLElement) => Element;
    hydratable: (observable: Element) => HTMLElement;
};

export function hydrate(name: string, options: HydrateOptions) {
    const optionsWithDecoratedHydrate = {
        ...options,
        hydrate: async (root: HTMLElement) => {
            if (root.dataset["frugalHydrated"] !== undefined) {
                return;
            }

            await options.hydrate(root);

            root.dataset["frugalHydrated"] = "";
        },
    };

    onRetroactiveReadyStateChange("complete", () => {
        const hydratableOnLoad = queryHydratables(name, "load");
        if (hydratableOnLoad.length !== 0) {
            hydrateOnLoad(hydratableOnLoad, optionsWithDecoratedHydrate);
        }

        const hydratableOnVisible = queryHydratables(name, "visible");
        if (hydratableOnVisible.length !== 0) {
            hydrateOnVisible(hydratableOnVisible, optionsWithDecoratedHydrate);
        }

        const hydratableOnIdle = queryHydratables(name, "idle");
        if (hydratableOnIdle.length !== 0) {
            hydrateOnIdle(hydratableOnIdle, optionsWithDecoratedHydrate);
        }

        const hydratableOnMediaQuery = queryHydratables(name, "media-query");
        if (hydratableOnMediaQuery.length !== 0) {
            hydrateOnMediaQuery(hydratableOnMediaQuery, optionsWithDecoratedHydrate);
        }
    });
}

export function queryHydratables(
    name: string,
    strategy: HydrationStrategy,
): NodeListOf<HTMLElement> {
    return document.querySelectorAll(
        `[data-frugal-hydratable="${name}"][data-frugal-hydration-strategy="${strategy}"]`,
    );
}

// hydrate immediatly
function hydrateOnLoad(hydratables: NodeListOf<HTMLElement>, { hydrate }: HydrateOptions) {
    Array.from(hydratables).map(async (root) => await hydrate(root));
}

// hydrate as soon as the main thread is idle
function hydrateOnIdle(hydratables: NodeListOf<HTMLElement>, { hydrate }: HydrateOptions) {
    if (typeof window.requestIdleCallback === "undefined") {
        setTimeout(() => {
            Array.from(hydratables).map(async (root) => await hydrate(root));
        }, 1);
    } else {
        requestIdleCallback(() => {
            Array.from(hydratables).map(async (root) => await hydrate(root));
        });
    }
}

// hydrate when the island enters the screen
function hydrateOnVisible(hydratables: NodeListOf<HTMLElement>, { observable, hydratable, hydrate }: HydrateOptions) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.map(async (entry) => {
            if (entry.isIntersecting && entry.target instanceof HTMLElement) {
                await hydrate(hydratable(entry.target));
                observer.unobserve(entry.target);
            }
        });
    });

    hydratables.forEach((root) => {
        observer.observe(observable(root));
    });
}

// hydrate on load if a media queries matches
function hydrateOnMediaQuery(hydratables: NodeListOf<HTMLElement>, { hydrate }: HydrateOptions) {
    Array.from(hydratables).map(async (root) => {
        const query = root.dataset["frugalHydrationQuery"];
        if (query && matchMedia(query)) {
            await hydrate(root);
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
