import type { GetApp } from "../types.ts";
import { hydrate as baseHydrate } from "../../hydrate.ts";
import { hydrateIsland } from "./hydrateIsland.ts";

export function hydrate(name: string, getApp: GetApp) {
    baseHydrate(name, {
        hydrate: async (root) => {
            hydrateIsland(root, await getApp());
        },
        observable: (root) => root,
        hydratable: (observable) => observable as HTMLElement,
    });
}
