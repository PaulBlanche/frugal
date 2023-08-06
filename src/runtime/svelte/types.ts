import { ClientComponent } from "./ClientComponent.ts";

declare global {
    interface FrugalGlobalNamespace {
        context: {
            data?: unknown;
            embedData: boolean;
            pathname: string;
        };
    }

    namespace globalThis {
        // deno-lint-ignore no-var
        var __FRUGAL__: FrugalGlobalNamespace;
    }
}

export type HydrationStrategy =
    | "load"
    | "idle"
    | "visible"
    | "media-query"
    | "never";

export type GetApp = () => Promise<ClientComponent> | ClientComponent;
