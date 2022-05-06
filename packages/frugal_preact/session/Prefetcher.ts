import * as utils from './utils.ts';

export type PrefetcherConfig = {
    defaultPrefetch: boolean;
    timeout: number;
    cooldown: number;
};

enum Status {
    INITIAL,
    WAITING,
    DONE,
}

export class Prefetcher {
    url: URL;
    anchor: HTMLAnchorElement;
    handle: number | undefined;
    status: Status;
    lastPrefetch: number;
    link: HTMLLinkElement | undefined;
    config: PrefetcherConfig;

    constructor(url: URL, anchor: HTMLAnchorElement, config: PrefetcherConfig) {
        this.url = url;
        this.anchor = anchor;
        this.status = Status.INITIAL;
        this.handle = undefined;
        this.config = config;
        this.lastPrefetch = 0;
    }

    shouldPrefetch() {
        const prefetch = this.anchor.dataset['frugalPrefetch'];
        const shouldPrefetch = this.config.defaultPrefetch
            ? prefetch !== 'false'
            : prefetch === 'true';
        return shouldPrefetch && utils.isInternalUrl(this.url);
    }

    shouldRefresh() {
        return this.status === Status.DONE &&
            Date.now() - this.lastPrefetch > this.config.cooldown;
    }

    schedule() {
        if (this.shouldRefresh()) {
            this.status = Status.INITIAL;
        }

        if (!this.shouldPrefetch() || this.status !== Status.INITIAL) {
            return;
        }

        this.status = Status.WAITING;

        this.handle = setTimeout(() => {
            this.prefetch();
        }, this.config.timeout);
    }

    cancel() {
        if (!this.shouldPrefetch() || this.status !== Status.WAITING) {
            return;
        }

        this.status = Status.INITIAL;

        clearTimeout(this.handle);
    }

    prefetch() {
        if (!this.shouldPrefetch() || this.status !== Status.WAITING) {
            return;
        }

        this.status = Status.DONE;
        this.lastPrefetch = Date.now();

        if (this.link === undefined) {
            this.link = document.createElement('link');
            this.link.rel = 'prefetch';
            this.link.href = this.url.href;
            document.head.appendChild(this.link);
        } else {
            document.head.removeChild(this.link);
            document.head.appendChild(this.link);
        }
    }
}
