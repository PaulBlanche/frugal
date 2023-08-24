import { hydrate } from "../../../../runtime/preact.client.ts";

export const NAME = "Dynamic";

if (import.meta.environment === "client") {
    hydrate(NAME, async () => {
        return (await import("./Dynamic.tsx")).Dynamic;
    });
}
