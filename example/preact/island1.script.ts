import { hydrate } from "../../src/runtime/preact/hydrate/mod.ts";
import { Island1 } from "./island1.tsx";

export const NAME = "Island1";

if (import.meta.main) {
    hydrate(NAME, () => Island1);
}
