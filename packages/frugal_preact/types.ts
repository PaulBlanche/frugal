export {};

declare global {
    interface FrugalGlobalNamespace {
        context: {
            data: any;
            pathname: string;
            timestamp: number;
        };
    }

    namespace globalThis {
        var __FRUGAL__: FrugalGlobalNamespace;
    }
}

export type HydrationStrategy =
    | 'load'
    | 'idle'
    | 'visible'
    | 'media-query'
    | 'never';
