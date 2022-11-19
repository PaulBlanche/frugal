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
    #url: URL;
    #anchor: HTMLAnchorElement;
    #timeoutHandle: number | undefined;
    #garbageCollectHandle: number | undefined;
    #status: Status;
    #config: PrefetcherConfig;
    #onGarbageCollectable: () => void;
    #lastPrefetch: number;
    #link: HTMLLinkElement | undefined;

    constructor(
        url: URL,
        anchor: HTMLAnchorElement,
        config: PrefetcherConfig,
        onGarbageCollectable: () => void,
    ) {
        this.#url = url;
        this.#anchor = anchor;
        this.#status = Status.INITIAL;
        this.#timeoutHandle = undefined;
        this.#garbageCollectHandle = undefined;
        this.#config = config;
        this.#onGarbageCollectable = onGarbageCollectable;
        this.#lastPrefetch = 0;
    }

    #shouldPrefetch() {
        const prefetch = this.#anchor.dataset['frugalPrefetch'];
        const shouldPrefetch = this.#config.defaultPrefetch
            ? prefetch !== 'false'
            : prefetch === 'true';
        return shouldPrefetch && utils.isInternalUrl(this.#url);
    }

    #shouldRefresh() {
        return this.#status === Status.DONE &&
            Date.now() - this.#lastPrefetch > this.#config.cooldown;
    }

    schedule() {
        if (this.#shouldRefresh()) {
            this.#status = Status.INITIAL;
        }

        if (!this.#shouldPrefetch() || this.#status !== Status.INITIAL) {
            return;
        }

        clearTimeout(this.#garbageCollectHandle);

        this.#status = Status.WAITING;

        this.#timeoutHandle = setTimeout(() => {
            this.#prefetch();
        }, this.#config.timeout);
    }

    cancel() {
        if (!this.#shouldPrefetch() || this.#status !== Status.WAITING) {
            return;
        }

        this.#status = Status.INITIAL;

        clearTimeout(this.#timeoutHandle);

        this.#garbageCollectHandle = setTimeout(() => {
            if (this.#link) {
                document.head.removeChild(this.#link);
            }
            this.#onGarbageCollectable();
        }, 5000);
    }

    #prefetch() {
        if (!this.#shouldPrefetch() || this.#status !== Status.WAITING) {
            return;
        }

        this.#status = Status.DONE;
        this.#lastPrefetch = Date.now();

        if (this.#link === undefined || !document.head.contains(this.#link)) {
            this.#link = document.createElement('link');
            this.#link.rel = 'prefetch';
            this.#link.href = this.#url.href;
            document.head.appendChild(this.#link);
        } else {
            document.head.removeChild(this.#link);
            document.head.appendChild(this.#link);
        }

        this.#garbageCollectHandle = setTimeout(() => {
            if (this.#link && this.#link.parentNode !== null) {
                document.head.removeChild(this.#link);
            }
            this.#onGarbageCollectable();
        }, 5000);
    }
}
