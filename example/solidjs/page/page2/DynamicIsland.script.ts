import { hydrate } from "../../../../runtime/solidjs.client.ts";

export const NAME = "Dynamic";

if (import.meta.environment === "client") {
    console.log("hydrate dynamic");
    hydrate(NAME, async () => {
        console.log("actual hydrate dynamic");
        return (await import("./Dynamic.tsx")).Dynamic;
    });
}
