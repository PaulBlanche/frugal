import { hydrate } from "$dep/frugal/runtime/preact.client.ts";
import { PageToc } from "./PageToc.tsx";

export const NAME = "PageToc";

if (import.meta.environment === "client") {
    hydrate(NAME, () => PageToc);
}
