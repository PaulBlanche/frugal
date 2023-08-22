import { hydrate } from "../../../../../runtime/preact.client.ts";
import { SharedCounter } from "./SharedCounter.tsx";

export const NAME = "SharedCounter";

if (import.meta.environment === "client") {
    hydrate(NAME, () => SharedCounter);
}
