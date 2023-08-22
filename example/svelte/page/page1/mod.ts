import Page1 from "./Page1.svelte";
import { getRenderFrom } from "../../../../runtime/svelte.server.ts";
import "../session.script.ts";

export const route = "/page1";

export const render = getRenderFrom(Page1);
