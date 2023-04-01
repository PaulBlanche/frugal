import { onReadyStateChange } from '../../client_session/mod.ts';
import type { GetApp, HydrationStrategy } from '../types.ts';
import { hydrateIsland } from './hydrateIsland.tsx';

export function hydrate<PROPS>(name: string, getApp: GetApp<PROPS>) {
  onReadyStateChange('complete', () => {
    const hydratableOnLoad = queryHydratables(name, 'load');
    if (hydratableOnLoad.length !== 0) {
      console.log('hydrate on load');
      hydrateOnLoad(hydratableOnLoad, getApp);
    }

    const hydratableOnVisible = queryHydratables(name, 'visible');
    if (hydratableOnVisible.length !== 0) {
      console.log('hydrate on visible');
      hydrateOnVisible(hydratableOnVisible, getApp);
    }

    const hydratableOnIdle = queryHydratables(name, 'idle');
    if (hydratableOnIdle.length !== 0) {
      hydrateOnIdle(hydratableOnIdle, getApp);
    }

    const hydratableOnMediaQuery = queryHydratables(name, 'media-query');
    if (hydratableOnMediaQuery.length !== 0) {
      hydrateOnMediaQuery(hydratableOnMediaQuery, getApp);
    }
  });
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
    console.log('do hydrate on load');
    hydrateIsland(script, await getApp());
  });
}

// hydrate as soon as the main thread is idle
function hydrateOnIdle<PROPS>(
  hydratables: NodeListOf<HTMLScriptElement>,
  getApp: GetApp<PROPS>,
) {
  setTimeout(() => {
    Array.from(hydratables).map(async (script) => {
      hydrateIsland(script, await getApp());
    });
  }, 10);
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
        console.log('do hydrate on visible');
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
    const query = root.dataset['hydrationQuery'];
    if (query && matchMedia(query)) {
      hydrateIsland(root, await getApp());
    }
  });
}
