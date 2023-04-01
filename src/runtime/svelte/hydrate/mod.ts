import { onReadyStateChange } from "../../client_session/mod.ts";
import type { GetApp, HydrationStrategy } from "../types.ts";
import { hydrateIsland } from "./hydrateIsland.ts";

export function hydrate(name: string, getApp: GetApp) {
  onReadyStateChange("complete", () => {
    const hydratableOnLoad = queryHydratables(name, "load");
    if (hydratableOnLoad.length !== 0) {
      hydrateOnLoad(hydratableOnLoad, name, getApp);
    }

    const hydratableOnVisible = queryHydratables(name, "visible");
    if (hydratableOnVisible.length !== 0) {
      hydrateOnVisible(hydratableOnVisible, name, getApp);
    }

    const hydratableOnIdle = queryHydratables(name, "idle");
    if (hydratableOnIdle.length !== 0) {
      hydrateOnIdle(hydratableOnIdle, name, getApp);
    }

    const hydratableOnMediaQuery = queryHydratables(name, "media-query");
    if (hydratableOnMediaQuery.length !== 0) {
      hydrateOnMediaQuery(hydratableOnMediaQuery, name, getApp);
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
  name: string,
  getApp: GetApp,
) {
  Array.from(hydratables).map(async (root) => {
    hydrateIsland(root, name, await getApp());
  });
}

// hydrate as soon as the main thread is idle
function hydrateOnIdle(
  hydratables: NodeListOf<HTMLElement>,
  name: string,
  getApp: GetApp,
) {
  setTimeout(() => {
    Array.from(hydratables).map(async (root) => {
      hydrateIsland(root, name, await getApp());
    });
  }, 10);
}

// hydrate when the island enters the screen
function hydrateOnVisible(
  hydratables: NodeListOf<HTMLElement>,
  name: string,
  getApp: GetApp,
) {
  const observer = new IntersectionObserver((entries, observer) => {
    entries.map(async (entry) => {
      if (entry.isIntersecting) {
        hydrateIsland(entry.target, name, await getApp());
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
  name,
  getApp: GetApp,
) {
  Array.from(hydratables).map(async (root) => {
    const query = root.dataset["hydrationQuery"];
    if (query && matchMedia(query)) {
      hydrateIsland(root, name, await getApp());
    }
  });
}
