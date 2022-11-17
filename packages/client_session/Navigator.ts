import { render } from './render/mod.ts';
import { SessionHistory } from './SessionHistory.ts';

export const LOADING_CLASSNAME = 'frugal-navigate-loading';

export type NavigatorConfig = {
    defaultNavigate: boolean;
    timeout: number;
    resetScroll: boolean;
    restoreScroll: boolean;
};

export class Navigator {
    #url: URL;
    #config: NavigatorConfig;
    scroll?: { x: number; y: number };
    #shouldRestoreScroll: boolean;

    constructor(url: URL, config: NavigatorConfig) {
        this.#url = url;
        this.#config = config;
        this.#shouldRestoreScroll = false;
    }

    saveScroll() {
        this.scroll = { x: scrollX, y: scrollY };
    }

    shouldRestoreScroll() {
        this.#shouldRestoreScroll = true;
    }

    get url() {
        return this.#url;
    }

    shouldVisit(directive?: string | null) {
        return this.#config.defaultNavigate
            ? directive !== 'false'
            : directive === 'true';
    }

    async visit(init?: RequestInit): Promise<boolean> {
        SessionHistory.getInstance().saveScroll();
        const result = await this.navigate(init);
        SessionHistory.getInstance().push(this);

        return result;
    }

    async navigate(init?: RequestInit): Promise<boolean> {
        this.#setReadyState('loading');

        const html = await this.#fetch(init);
        const nextDocument = new DOMParser().parseFromString(
            html,
            'text/html',
        );

        if (!this.#shouldProcessNavigate(nextDocument)) {
            return false;
        }

        render(nextDocument);

        this.#setReadyState('interactive');

        if (!this.#tryToScrollToHash()) {
            if (this.#shouldRestoreScroll && this.#config.restoreScroll) {
                scroll(this.scroll?.x ?? 0, this.scroll?.y ?? 0);
            } else if (this.#config.resetScroll) {
                window.scroll(0, 0);
            }
        }

        this.#setReadyState('complete');

        return true;
    }

    #tryToScrollToHash() {
        if (this.#url.hash.startsWith('#')) {
            const scrollTarget = document.querySelector(this.#url.hash);
            if (scrollTarget !== null) {
                scrollTarget.scrollIntoView();
                return true;
            }
        }

        return false;
    }

    #setReadyState(readystate: DocumentReadyState) {
        dispatchEvent(
            new CustomEvent('frugal:readystatechange', {
                detail: { readystate },
            }),
        );
    }

    #shouldProcessNavigate(document: Document) {
        const frugalVisitTypeMeta = document.querySelector(
            'head meta[name="frugal-navigate"]',
        );
        if (frugalVisitTypeMeta) {
            const navigate = frugalVisitTypeMeta.getAttribute('content');
            return this.shouldVisit(navigate);
        }

        return true;
    }

    async #fetch(init?: RequestInit) {
        const handle = setTimeout(() => {
            document.body.classList.add(LOADING_CLASSNAME);
        }, this.#config.timeout);

        const response = await fetch(this.#url.href, init);

        if (response.redirected) {
            const hash = this.#url.hash;
            this.#url = new URL(response.url);
            this.#url.hash = hash;
        }

        const html = await response.text();

        clearTimeout(handle);
        document.body.classList.remove(LOADING_CLASSNAME);

        return html;
    }
}
