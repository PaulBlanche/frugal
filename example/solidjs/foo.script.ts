import { hydrate } from "solid-js/web";
import { Page } from "./Page.tsx";

if (import.meta.environment === "client") {
    hydrate(Page, document.body);
}
