import { render } from "./render/mod.ts";
import { History } from "./History.ts";

export const LOADING_CLASSNAME = "frugal-navigate-loading";

export type NavigatorConfig = {
    defaultNavigate: boolean;
    timeout: number;
    resetScroll: boolean;
    restoreScroll: boolean;
};

export class Navigator {
    _url: URL;
    _config: NavigatorConfig;
    scroll?: { x: number; y: number };
    _shouldRestoreScroll: boolean;

    constructor(url: URL, config: NavigatorConfig) {
        this._url = url;
        this._config = config;
        this._shouldRestoreScroll = false;
    }

    saveScroll() {
        this.scroll = { x: scrollX, y: scrollY };
    }

    shouldRestoreScroll() {
        this._shouldRestoreScroll = true;
    }

    get url() {
        return this._url;
    }

    shouldVisit(directive?: string | null) {
        return this._config.defaultNavigate ? directive !== "false" : directive === "true";
    }

    async visit(init?: RequestInit): Promise<boolean> {
        const progress = document.createElement("div");
        document.body.appendChild(progress);
        progress.style.position = "fixed";
        progress.style.top = "0";
        progress.style.height = "5px";
        progress.style.left = "0";
        progress.style.width = "0";
        progress.style.background = "blue";
        progress.style.transition = "width linear 0.1s";
        progress.style.zIndex = "10000";

        console.log(progress);

        let width = 0;
        const interval = setInterval(() => {
            width = width + (100 - width) / 10;
            progress.style.width = `${width}%`;
        }, 100);

        History.saveScroll();

        await new Promise((res) => setTimeout(res, 1000));
        const result = await this.navigate(init);
        if (result) {
            History.push(this);
        }
        clearInterval(interval);

        return result;
    }

    async navigate(init?: RequestInit): Promise<boolean> {
        this._setReadyState("loading");

        const html = await this._fetch(init);

        const nextDocument = new DOMParser().parseFromString(
            html,
            "text/html",
        );

        if (!this._shouldProcessNavigate(nextDocument)) {
            return false;
        }

        this._onBeforeUnload();

        render(nextDocument);

        this._setReadyState("interactive");

        if (!this._tryToScrollToHash()) {
            if (this._shouldRestoreScroll && this._config.restoreScroll) {
                scroll(this.scroll?.x ?? 0, this.scroll?.y ?? 0);
            } else if (this._config.resetScroll) {
                window.scroll(0, 0);
            }
        }

        this._setReadyState("complete");

        return true;
    }

    _tryToScrollToHash() {
        if (this._url.hash.startsWith("#")) {
            const scrollTarget = document.querySelector(this._url.hash);
            if (scrollTarget !== null) {
                scrollTarget.scrollIntoView();
                return true;
            }
        }

        return false;
    }

    _onBeforeUnload() {
        dispatchEvent(new CustomEvent("frugal:beforeunload"));
    }

    _setReadyState(readystate: DocumentReadyState) {
        dispatchEvent(
            new CustomEvent("frugal:readystatechange", {
                detail: { readystate },
            }),
        );
    }

    _shouldProcessNavigate(document: Document) {
        const frugalVisitTypeMeta = document.querySelector(
            'head meta[name="frugal-navigate"]',
        );
        if (frugalVisitTypeMeta) {
            const navigate = frugalVisitTypeMeta.getAttribute("content");
            return this.shouldVisit(navigate);
        }

        return true;
    }

    async _fetch(init?: RequestInit) {
        const handle = setTimeout(() => {
            document.body.classList.add(LOADING_CLASSNAME);
        }, this._config.timeout);

        const response = await fetch(this._url.href, init);

        if (response.redirected) {
            const hash = this._url.hash;
            this._url = new URL(response.url);
            this._url.hash = hash;
        }

        const html = await response.text();

        clearTimeout(handle);
        document.body.classList.remove(LOADING_CLASSNAME);

        return html;
    }
}
