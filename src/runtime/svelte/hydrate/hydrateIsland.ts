import { ClientComponent } from "../ClientComponent.ts";
import { DATA_CONTEXT_KEY } from "../dataContext.ts";
import Hydratable from "./Hydratable.svelte";
import "../types.ts";

export function hydrateIsland(
    root: HTMLElement,
    component: ClientComponent,
) {
    const propsScript = root.querySelector("script");
    const props = propsScript?.textContent ? JSON.parse(propsScript.textContent) : {};

    const html = root.querySelector("[data-svelte-slot]")?.innerHTML;

    console.log(Hydratable);

    new Hydratable({
        target: root,
        hydrate: true,
        props: {
            component,
            props,
            html,
        },
        context: new Map([[DATA_CONTEXT_KEY, window.__FRUGAL__.context]]),
    });

    root.dataset["hydrated"] = "";
}
