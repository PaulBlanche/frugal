import { ClientComponent } from "../ClientComponent.ts";
import { DATA_CONTEXT_KEY } from "../dataContext.ts";
//@deno-types="../../../../runtime/svelte/island.d.ts"
import Hydratable from "./Hydratable.svelte";
import "../types.ts";

const HYDRATED = new WeakSet();

export function hydrateIsland(
  root: HTMLElement,
  name: string,
  component: ClientComponent,
) {
  if (HYDRATED.has(root)) {
    // the island was already hydrated
    return;
  }

  HYDRATED.add(root);

  const propsScript = root.querySelector("script");
  const props = propsScript?.textContent
    ? JSON.parse(propsScript.textContent)
    : {};

  const html = root.querySelector("[data-svelte-slot]")?.innerHTML;

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
