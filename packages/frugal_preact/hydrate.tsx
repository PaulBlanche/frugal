/* @jsx preact.h */
/* @jsxFrag preact.Fragment */
import * as preact from 'preact';
import { DataProvider } from './dataContext.tsx';
import type { HydrationStrategy } from './types.ts';

type App<PROPS> = (props: PROPS) => Promise<preact.VNode> | preact.VNode;

type GetApp<PROPS> = () => App<PROPS>;

export function hydrate<PROPS>(name: string, getApp: GetApp<PROPS>) {
    const hydratableOnLoad = queryHydratables(name, 'load');
    if (hydratableOnLoad.length !== 0) {
        hydrateOnLoad(hydratableOnLoad, getApp);
    }

    const hydratableOnVisible = queryHydratables(name, 'visible');
    if (hydratableOnVisible.length !== 0) {
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
}

function hydrateOnLoad<PROPS>(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp<PROPS>,
) {
    hydratables.forEach((root) => {
        hydrateElement(root, getApp());
    });
}

function hydrateOnIdle<PROPS>(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp<PROPS>,
) {
    setTimeout(() => {
        hydratables.forEach((root) => {
            hydrateElement(root, getApp());
        });
    }, 10);
}

function hydrateOnVisible<PROPS>(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp<PROPS>,
) {
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                hydrateElement(entry.target, getApp());
                observer.unobserve(entry.target);
            }
        });
    });

    hydratables.forEach((root) => {
        observer.observe(root);
    });
}

function hydrateOnMediaQuery<PROPS>(
    hydratables: NodeListOf<HTMLElement>,
    getApp: GetApp<PROPS>,
) {
    hydratables.forEach((root) => {
        const query = root.dataset['hydrationQuery'];
        if (query && matchMedia(query)) {
            hydrateElement(root, getApp());
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

export async function hydrateElement<PROPS>(root: Element, App: App<PROPS>) {
    const data = root.querySelector('[type="application/json"]')!;
    const props: PROPS = JSON.parse(data.textContent!);

    const syncApp = await App(props);

    preact.render(
        <DataProvider>
            {syncApp}
        </DataProvider>,
        root,
    );
}
