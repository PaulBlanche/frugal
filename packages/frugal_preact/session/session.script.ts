import { PrefetchObserver } from './PrefetchObserver.ts';
import { NavigationObserver } from './NavigationObserver.ts';

import '../types.ts';

export function main() {
    const prefetchConfig = window.__FRUGAL__.prefetch;
    new PrefetchObserver({
        defaultPrefetch: prefetchConfig?.defaultPrefetch ?? true,
        timeout: prefetchConfig?.timeout ?? 80,
        cooldown: prefetchConfig?.cooldown ?? 1000,
    }).observe();

    const navigateConfig = window.__FRUGAL__.navigate;
    new NavigationObserver({
        defaultNavigate: navigateConfig?.defaultNavigate ?? true,
        timeout: prefetchConfig?.timeout ?? 150,
    }).observe();
}
