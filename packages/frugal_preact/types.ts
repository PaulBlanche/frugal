import { NavigatorConfig } from './session/Navigator.ts';
import { PrefetcherConfig } from './session/Prefetcher.ts';

declare global {
    interface FrugalGlobalNamespace {
        context?: {
            // deno-lint-ignore no-explicit-any
            data: any;
            pathname: string;
        };
        prefetch?: PrefetcherConfig;
        navigate?: NavigatorConfig;
    }

    namespace globalThis {
        // deno-lint-ignore no-var
        var __FRUGAL__: FrugalGlobalNamespace;
    }

    interface WindowEventMap {
        'frugal:readystatechange': CustomEvent<
            { readystate: DocumentReadyState }
        >;
    }
}

export type HydrationStrategy =
    | 'load'
    | 'idle'
    | 'visible'
    | 'media-query'
    | 'never';
