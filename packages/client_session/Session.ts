import { VisitObserver } from './VisitObserver.ts';
import { Navigator, NavigatorConfig } from './Navigator.ts';
import { PrefetcherConfig } from './Prefetcher.ts';
import { PrefetchObserver } from './PrefetchObserver.ts';
import { SessionHistory } from './SessionHistory.ts';
import { SubmitObserver } from './SubmitObserver.ts';
import { Submitter } from './Submitter.ts';
import * as utils from './utils.ts';

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
    #visitObserver: VisitObserver;
    #submitObserver: SubmitObserver;
    #prefetchObserver: PrefetchObserver;

    static create(config?: PartialSessionConfig) {
        if (window[SESSION_INSTANCE] !== undefined) {
            throw Error(
                'A Session instance was already created',
            );
        }

        window[SESSION_INSTANCE] = new Session(config);

        return window[SESSION_INSTANCE];
    }

    static getInstance() {
        if (window[SESSION_INSTANCE] === undefined) {
            return Session.create();
        }

        return window[SESSION_INSTANCE];
    }

    private constructor(config: PartialSessionConfig = {}) {
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
        this.#visitObserver = new VisitObserver(this.#config.navigate);
        this.#submitObserver = new SubmitObserver(this.#config.navigate);
        this.#prefetchObserver = new PrefetchObserver(this.#config.prefetch);

        SessionHistory.create(this.#config.navigate);
    }

    start() {
        SessionHistory.getInstance().observe();
        this.#visitObserver.observe();
        this.#submitObserver.observe();
        this.#prefetchObserver.observe();
    }

    async navigate(url: URL | string): Promise<boolean> {
        const navigator = new Navigator(
            new URL(url, location.href),
            this.#config.navigate,
        );

        return await navigator.visit();
    }

    async submit(form: HTMLFormElement): Promise<boolean> {
        const url = utils.getFormUrl(form);
        const navigator = new Navigator(
            new URL(url, location.href),
            this.#config.navigate,
        );

        const submiter = new Submitter(form, undefined, navigator);

        return await submiter.submit();
    }
}
