import * as utils from "./utils.ts";

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
    _url: URL;
    _anchor: HTMLAnchorElement;
    _timeoutHandle: number | undefined;
    _garbageCollectHandle: number | undefined;
    _status: Status;
    _config: PrefetcherConfig;
    _onGarbageCollectable: () => void;
    _lastPrefetch: number;
    _link: HTMLLinkElement | undefined;

    constructor(
        url: URL,
        anchor: HTMLAnchorElement,
        config: PrefetcherConfig,
        onGarbageCollectable: () => void,
    ) {
        this._url = url;
        this._anchor = anchor;
        this._status = Status.INITIAL;
        this._timeoutHandle = undefined;
        this._garbageCollectHandle = undefined;
        this._config = config;
        this._onGarbageCollectable = onGarbageCollectable;
        this._lastPrefetch = 0;
    }

    _shouldPrefetch() {
        const prefetch = this._anchor.dataset["frugalPrefetch"];
        const shouldPrefetch = this._config.defaultPrefetch ? prefetch !== "false" : prefetch === "true";
        return shouldPrefetch && utils.isInternalUrl(this._url);
    }

    _shouldRefresh() {
        return this._status === Status.DONE &&
            Date.now() - this._lastPrefetch > this._config.cooldown;
    }

    schedule() {
        if (this._shouldRefresh()) {
            this._status = Status.INITIAL;
        }

        if (!this._shouldPrefetch() || this._status !== Status.INITIAL) {
            return;
        }

        clearTimeout(this._garbageCollectHandle);

        this._status = Status.WAITING;

        this._timeoutHandle = setTimeout(() => {
            this._prefetch();
        }, this._config.timeout);
    }

    cancel() {
        if (!this._shouldPrefetch() || this._status !== Status.WAITING) {
            return;
        }

        this._status = Status.INITIAL;

        clearTimeout(this._timeoutHandle);

        this._garbageCollectHandle = setTimeout(() => {
            if (this._link && document.head === this._link.parentNode) {
                document.head.removeChild(this._link);
            }
            this._onGarbageCollectable();
        }, 5000);
    }

    _prefetch() {
        if (!this._shouldPrefetch() || this._status !== Status.WAITING) {
            return;
        }

        this._status = Status.DONE;
        this._lastPrefetch = Date.now();

        if (this._link === undefined || !document.head.contains(this._link)) {
            this._link = document.createElement("link");
            this._link.rel = "prefetch";
            this._link.href = this._url.href;
            document.head.appendChild(this._link);
        } else {
            document.head.removeChild(this._link);
            document.head.appendChild(this._link);
        }

        this._garbageCollectHandle = setTimeout(() => {
            if (this._link && this._link.parentNode !== null) {
                document.head.removeChild(this._link);
            }
            this._onGarbageCollectable();
        }, 5000);
    }
}
