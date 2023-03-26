import Hydratable from './Hydratable.svelte';

//import { DataProvider } from '../dataContext.tsx';
//import { HeadProvider } from '../Head.tsx';
//import { App } from '../types.ts';

// Setup a signal that changes on each session navigation (will force rerender
// each hydrated island)
/*const RERENDER_SIGNAL = signal.signal(0);
onReadyStateChange('complete', () => {
    RERENDER_SIGNAL.value += 1;
});*/

const HYDRATED = new WeakSet();

export function hydrateIsland(
    root: HTMLElement,
    // deno-lint-ignore no-explicit-any
    component: any,
) {
    if (HYDRATED.has(root)) {
        // the island was already hydrated
        return;
    }

    HYDRATED.add(root);
    console.log('hydrate', root);

    const propsScript = root.querySelector('script');
    const props = propsScript?.textContent ? JSON.parse(propsScript.textContent) : {};

    new Hydratable({
        target: root,
        hydrate: true,
        props: {
            component,
            props,
        },
    });
}
