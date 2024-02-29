import type { GetApp } from "../types.ts";
import { hydrate as baseHydrate } from "../../hydrate.ts";
import { hydrateIsland } from "./hydrateIsland.tsx";

export function hydrate<PROPS>(name: string, getApp: GetApp<PROPS>) {
    baseHydrate(name, {
        hydrate: async (root) => {
            hydrateIsland(root, await getApp());
        },
        observable: (root) => root.nextElementSibling!,
        hydratable: (observable) => observable.previousElementSibling! as HTMLElement,
    });
}
