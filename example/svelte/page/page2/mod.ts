import Page2 from "./Page2.svelte";
import { getRenderFrom } from "../../../../runtime/svelte.server.ts";
import "../session.script.ts";

export const route = "/page2";

export const render = getRenderFrom(Page2);
