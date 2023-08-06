import HomePage from "./HomePage2.svelte";
import { PageResponse } from "../../page.ts";
import { getRenderFrom } from "../../src/runtime/svelte/getRenderFrom.ts";
import "./session.script.ts";

export const self = import.meta.url;

export const pattern = "/home2";

export function generate() {
    return new PageResponse({ data: { framework: "svelte" } });
}

export const render = getRenderFrom(HomePage);
