import { hydrate } from "../../../../runtime/svelte.client.ts";

export const NAME = "Dynamic";

if (import.meta.environment === "client") {
    hydrate(NAME, async () => {
        return (await import("./Dynamic.svelte")).default;
    });
}
