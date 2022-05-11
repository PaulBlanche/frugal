import { PrefetchObserver } from './PrefetchObserver.ts';
import { NavigationObserver } from './NavigationObserver.ts';
import { NavigatorConfig } from './Navigator.ts';
import { PrefetcherConfig } from './Prefetcher.ts';

import '../types.ts';

type SessionConfig = {
    prefetch?: Partial<PrefetcherConfig>;
    navigate?: Partial<NavigatorConfig>;
};

export class Session {
    constructor(config: SessionConfig = {}) {
        const prefetchConfig = config.prefetch;
        new PrefetchObserver({
            defaultPrefetch: prefetchConfig?.defaultPrefetch ?? true,
            timeout: prefetchConfig?.timeout ?? 80,
            cooldown: prefetchConfig?.cooldown ?? 1000,
        }).observe();

        const navigateConfig = config.navigate;
        new NavigationObserver({
            defaultNavigate: navigateConfig?.defaultNavigate ?? true,
            timeout: prefetchConfig?.timeout ?? 150,
        }).observe();
    }
}
