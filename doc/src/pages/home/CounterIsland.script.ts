import { hydrate } from "$dep/frugal/runtime/preact.client.ts";
//import "$dep/frugal/mod.ts";
import { Counter } from "./Counter.tsx";

export const NAME = "Counter";

if (import.meta.environment === "client") {
    hydrate(NAME, () => Counter);
}
