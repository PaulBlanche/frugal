import { hydrate } from "../../runtime/svelte.client.ts";

export const NAME = "Counter";

if (import.meta.environment === "client") {
    hydrate(NAME, async () => {
        const mod = await import("./Counter.svelte");
        return mod.default;
    });
}
