import * as solid from "solid-js";

export * from "../types.ts";

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

export type App<PROPS> = solid.Component<PROPS>;

export type GetApp<PROPS> = () => Promise<App<PROPS>> | App<PROPS>;
