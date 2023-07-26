import { VisitObserver } from "./VisitObserver.ts";
import { Navigator, NavigatorConfig } from "./Navigator.ts";
import { PrefetcherConfig } from "./Prefetcher.ts";
import { PrefetchObserver } from "./PrefetchObserver.ts";
import { History } from "./History.ts";
import { SubmitObserver } from "./SubmitObserver.ts";
import { Submitter } from "./Submitter.ts";
import { Form, Method } from "./Form.ts";

export type SessionConfig = {
    prefetch: PrefetcherConfig;
    navigate: NavigatorConfig;
};

type PartialSessionConfig = {
    prefetch?: Partial<PrefetcherConfig>;
    navigate?: Partial<NavigatorConfig>;
};

export class Session {
    static init(config: PartialSessionConfig = {}) {
        if (SessionInternal.instance !== undefined) {
            throw new Error("Session was already initialised");
        }

        SessionInternal.instance = new SessionInternal(config);
        SessionInternal.instance.start();
    }

    static navigate(url: URL | string): Promise<boolean> {
        if (SessionInternal.instance === undefined) {
            throw new Error("Session must be initialised first");
        }

        return SessionInternal.instance.navigate(url);
    }

    static submit(formElement: HTMLFormElement): Promise<boolean> {
        if (SessionInternal.instance === undefined) {
            throw new Error("Session must be initialised first");
        }

        return SessionInternal.instance.submit(formElement);
    }
}

class SessionInternal {
    _config: SessionConfig;
    _visitObserver: VisitObserver;
    _submitObserver: SubmitObserver;
    _prefetchObserver: PrefetchObserver;

    static instance?: SessionInternal;

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

    async navigate(url: URL | string): Promise<boolean> {
        const navigator = new Navigator(
            new URL(url, location.href),
            this._config.navigate,
        );

        return await navigator.visit();
    }

    async submit(formElement: HTMLFormElement): Promise<boolean> {
        const form = new Form(formElement);

        if (form.method === Method.DIALOG) {
            return false;
        }

        const navigator = new Navigator(form.url, this._config.navigate);
        const submiter = new Submitter(form, navigator);

        return await submiter.submit();
    }
}
