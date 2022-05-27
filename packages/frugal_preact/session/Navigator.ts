import * as utils from './utils.ts';
import { Renderer } from './Renderer.ts';
import '../types.ts';

export const LOADING_CLASSNAME = 'frugal-prefetch-loading';

export type NavigatorConfig = {
    defaultNavigate: boolean;
    timeout: number;
};

export class Navigator {
    url: URL;
    config: NavigatorConfig;
    anchor: HTMLAnchorElement;

    constructor(url: URL, anchor: HTMLAnchorElement, config: NavigatorConfig) {
        this.url = url;
        this.config = config;
        this.anchor = anchor;
    }

    shouldNavigate(directive?: string | null) {
        return this.config.defaultNavigate
            ? directive !== 'false'
            : directive === 'true';
    }

    shouldHandleNavigate() {
        const rel = this.anchor.dataset['frugalPrefetch'] ?? '';
        const isExternal = rel.split(' ').includes('external');

        const navigate = this.anchor.dataset['frugalNavigate'];

        return this.shouldNavigate(navigate) && !isExternal &&
            utils.isInternalUrl(this.url);
    }

    shouldProcessNavigate(document: Document) {
        const frugalVisitTypeMeta = document.querySelector(
            'head meta[name="frugal-navigate"]',
        );
        if (frugalVisitTypeMeta) {
            const navigate = frugalVisitTypeMeta.getAttribute('content');
            return this.shouldNavigate(navigate);
        }

        return true;
    }

    async navigate() {
        if (!this.shouldHandleNavigate()) {
            this.realNavigate();
            return;
        }

        try {
            this.setReadyState('loading');

            const html = await this.fetch();
            const nextDocument = new DOMParser().parseFromString(
                html,
                'text/html',
            );

            if (!this.shouldProcessNavigate(nextDocument)) {
                this.realNavigate();
                return;
            }

            new Renderer(nextDocument).render();
            history.pushState(null, '', this.url);

            this.setReadyState('interactive');

            if (this.url.hash.startsWith('#')) {
                const scrollTarget = document.querySelector(this.url.hash);
                if (scrollTarget !== null) {
                    scrollTarget.scrollIntoView();
                }
            }

            this.setReadyState('complete');
        } catch (error: unknown) {
            console.error(error);
            this.realNavigate();
            return;
        }
    }

    setReadyState(readystate: DocumentReadyState) {
        dispatchEvent(
            new CustomEvent('frugal:readystatechange', {
                detail: { readystate },
            }),
        );
    }

    async fetch() {
        const handle = setTimeout(() => {
            document.body.classList.add(LOADING_CLASSNAME);
        }, this.config.timeout);

        const response = await fetch(this.url.href);

        const html = await response.text();

        clearTimeout(handle);
        document.body.classList.remove(LOADING_CLASSNAME);

        return html;
    }

    realNavigate() {
        location.href = this.url.href;
    }
}

const readyStateOrder: Record<DocumentReadyState, number> = {
    'loading': 0,
    'interactive': 1,
    'complete': 2,
};

export function onReadyStateChange(
    readyState: DocumentReadyState,
    callback: () => void,
) {
    if (readyStateOrder[document.readyState] >= readyStateOrder[readyState]) {
        callback();
    } else {
        document.addEventListener('readystatechange', () => {
            if (document.readyState === readyState) {
                callback();
            }
        });
    }

    addEventListener(
        'frugal:readystatechange',
        (event) => {
            if (event.detail.readystate === readyState) {
                callback();
            }
        },
    );
}
