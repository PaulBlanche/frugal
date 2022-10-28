import { Renderer } from './Renderer.ts';

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

    _shouldNavigate(directive?: string | null) {
        return this.#config.defaultNavigate
            ? directive !== 'false'
            : directive === 'true';
    }

    async navigate(): Promise<void> {
        try {
            this.#setReadyState('loading');

            const html = await this.#fetch();
            const nextDocument = new DOMParser().parseFromString(
                html,
                'text/html',
            );

            if (!this.#shouldProcessNavigate(nextDocument)) {
                this._realNavigate();
                return;
            }
            new Renderer(nextDocument).render();

            this.#setReadyState('interactive');

            if (!this.#tryToScrollToHash()) {
                if (this.#shouldRestoreScroll && this.#config.restoreScroll) {
                    scroll(this.scroll?.x ?? 0, this.scroll?.y ?? 0);
                } else if (this.#config.resetScroll) {
                    window.scroll(0, 0);
                }
            }

            this.#setReadyState('complete');
        } catch (error: unknown) {
            console.error(error);
            this._realNavigate();
            return;
        }
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
            return this._shouldNavigate(navigate);
        }

        return true;
    }

    async #fetch(init?: RequestInit) {
        const handle = setTimeout(() => {
            document.body.classList.add(LOADING_CLASSNAME);
        }, this.#config.timeout);

        const response = await fetch(this.#url.href, init);

        const html = await response.text();

        clearTimeout(handle);
        document.body.classList.remove(LOADING_CLASSNAME);

        return html;
    }

    _realNavigate() {
        location.href = this.#url.href;
    }
}
