import { getRenderFrom } from "../../../../runtime/preact.server.ts";
import { Page2 } from "./Page2.tsx";

export const route = "/page2";

export const render = getRenderFrom(Page2);
