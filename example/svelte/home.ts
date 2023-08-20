import HomePage from "./HomePage.svelte";
import { DataResponse } from "../../mod.ts";
import { getRenderFrom } from "../../src/runtime/svelte/getRenderFrom.ts";
import "./session.script.ts";

export const route = "/";

export function generate() {
    return new DataResponse({ framework: "svelte" });
}

export const render = getRenderFrom(HomePage);
