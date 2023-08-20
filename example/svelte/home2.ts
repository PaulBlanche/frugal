import HomePage from "./HomePage2.svelte";
import { DataResponse } from "../../mod.ts";
import { getRenderFrom } from "../../src/runtime/svelte/getRenderFrom.ts";
import "./session.script.ts";

export const route = "/home2";

export function generate() {
    return new DataResponse({ framework: "svelte" });
}

export const render = getRenderFrom(HomePage);
