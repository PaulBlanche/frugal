import { getRenderFrom } from "../../src/runtime/preact/getRenderFrom.tsx";
import { Page1 } from "./Page1.tsx";

export const pattern = "/page1";

export const render = getRenderFrom(Page1);
