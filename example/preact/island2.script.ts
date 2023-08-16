import { hydrate } from "../../src/runtime/preact/hydrate/mod.ts";
import { Island2 } from "./island2.tsx";

export const NAME = "Island2";

if (import.meta.main) {
    hydrate(NAME, () => Island2);
}
