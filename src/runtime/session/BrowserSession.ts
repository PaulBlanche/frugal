import { VisitObserver } from "./VisitObserver.ts";
import { Navigator, NavigatorConfig } from "./Navigator.ts";
import { PrefetcherConfig } from "./Prefetcher.ts";
import { PrefetchObserver } from "./PrefetchObserver.ts";
import { History } from "./History.ts";
import { SubmitObserver } from "./SubmitObserver.ts";
import { Submitter } from "./Submitter.ts";
import { Form, Method } from "./Form.ts";
import { NavigationResult, Reason } from "./Reason.ts";

export type SessionConfig = {
    prefetch: PrefetcherConfig;
    navigate: NavigatorConfig;
};

type PartialSessionConfig = {
    prefetch?: Partial<PrefetcherConfig>;
    navigate?: Partial<NavigatorConfig>;
};

export class BrowserSession {
    static init(config: PartialSessionConfig = {}) {
        if (BrowserSessionInternal.instance !== undefined) {
            throw new Error("Session was already initialised");
        }

        BrowserSessionInternal.instance = new BrowserSessionInternal(config);
        BrowserSessionInternal.instance.start();
    }

    static navigate(url: URL | string): Promise<NavigationResult> {
        if (BrowserSessionInternal.instance === undefined) {
            throw new Error("Session must be initialised first");
        }

        return BrowserSessionInternal.instance.navigate(url);
    }

    static submit(formElement: HTMLFormElement): Promise<NavigationResult> {
        if (BrowserSessionInternal.instance === undefined) {
            throw new Error("Session must be initialised first");
        }

        return BrowserSessionInternal.instance.submit(formElement);
    }
}

class BrowserSessionInternal {
    _config: SessionConfig;
    _visitObserver: VisitObserver;
    _submitObserver: SubmitObserver;
    _prefetchObserver: PrefetchObserver;

    static instance?: BrowserSessionInternal;

    constructor(config: PartialSessionConfig = {}) {
        this._config = {
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
        this._visitObserver = new VisitObserver(this._config.navigate);
        this._submitObserver = new SubmitObserver(this._config.navigate);
        this._prefetchObserver = new PrefetchObserver(this._config.prefetch);

        History.init(this._config.navigate);
    }

    start() {
        History.observe();
        this._visitObserver.observe();
        this._submitObserver.observe();
        this._prefetchObserver.observe();
    }

    async navigate(url: URL | string): Promise<NavigationResult> {
        const navigator = new Navigator(
            new URL(url, location.href),
            this._config.navigate,
        );

        return await navigator.visit();
    }

    async submit(formElement: HTMLFormElement): Promise<NavigationResult> {
        const form = new Form(formElement);

        if (form.method === Method.DIALOG) {
            return { success: false, reason: Reason.DIALOG_FORM };
        }

        const navigator = new Navigator(form.url, this._config.navigate);
        const submiter = new Submitter(form, navigator);

        return await submiter.submit();
    }
}
