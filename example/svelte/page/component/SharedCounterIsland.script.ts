import { hydrate } from "../../../../runtime/svelte.client.ts";
import Counter from "./SharedCounter.svelte";

export const NAME = "Counter";

if (import.meta.environment === "client") {
    hydrate(NAME, async () => Counter);
}
