import { NavigationObserver } from './NavigationObserver.ts';
import { Navigator, NavigatorConfig } from './Navigator.ts';
import { PrefetcherConfig } from './Prefetcher.ts';
import { PrefetchObserver } from './PrefetchObserver.ts';
import { SessionHistory } from './SessionHistory.ts';

type SessionConfig = {
    prefetch: PrefetcherConfig;
    navigate: NavigatorConfig;
};

type PartialSessionConfig = {
    prefetch?: Partial<PrefetcherConfig>;
    navigate?: Partial<NavigatorConfig>;
};

const SESSION_INSTANCE = `$$frugal-session-instance$$`;

declare global {
    interface Window {
        [SESSION_INSTANCE]?: Session;
    }
}

export class Session {
    #config: SessionConfig;
    #history: SessionHistory;
    #navigationObserver: NavigationObserver;
    #prefetchObserver: PrefetchObserver;

    static getInstance() {
        return new Session();
    }

    constructor(config: PartialSessionConfig = {}) {
        this.#config = {
            prefetch: {
                defaultPrefetch: config.prefetch?.defaultPrefetch ?? true,
                timeout: config.prefetch?.timeout ?? 80,
                cooldown: config.prefetch?.cooldown ?? 1000,
            },
            navigate: {
                defaultNavigate: config.navigate?.defaultNavigate ?? true,
                timeout: config.navigate?.timeout ?? 150,
                resetScroll: config.navigate?.resetScroll ?? true,
                restoreScroll: config.navigate?.restoreScroll ?? true,
            },
        };
        this.#history = SessionHistory.getInstance(this.#config.navigate);
        this.#navigationObserver = NavigationObserver.getInstance(
            this.#config.navigate,
        );
        this.#prefetchObserver = PrefetchObserver.getInstance(
            this.#config.prefetch,
        );

        if (window[SESSION_INSTANCE] !== undefined) {
            return window[SESSION_INSTANCE];
        }

        window[SESSION_INSTANCE] = this;
    }

    start() {
        this.#history.observe();
        this.#navigationObserver.observe();
        this.#prefetchObserver.observe();
    }

    async navigate(url: URL | string): Promise<void> {
        const navigator = new Navigator(
            new URL(url, location.href),
            this.#config.navigate,
        );

        this.#history.saveScroll();

        await navigator.navigate();

        this.#history.push(navigator);
    }
}
