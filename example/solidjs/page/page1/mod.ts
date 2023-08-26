import { getRenderFrom } from "../../../../runtime/solidjs.server.ts";
import { Page1 } from "./Page1.tsx";

export const route = "/page1";

export const render = getRenderFrom(Page1);
