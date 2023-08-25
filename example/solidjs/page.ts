import { generateHydrationScript, renderToString } from "solid-js/web";

import "./foo.script.ts";
import { Page } from "./Page.tsx";
import { getRenderFrom } from "../../src/runtime/solidjs/getRenderFrom.tsx";

export const route = "/page1";

export const render = getRenderFrom(Page);
