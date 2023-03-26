declare global {
    interface FrugalGlobalNamespace {
        context?: {
            // deno-lint-ignore no-explicit-any
            data: any;
            pathname: string;
        };
    }

    namespace globalThis {
        // deno-lint-ignore no-var
        var __FRUGAL__: FrugalGlobalNamespace;
    }
}

export type HydrationStrategy =
    | 'load'
    | 'idle'
    | 'visible'
    | 'media-query'
    | 'never';

// deno-lint-ignore no-explicit-any
export type GetApp = () => Promise<any> | any;
