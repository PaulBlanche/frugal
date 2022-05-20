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

    shouldNavigate() {
        const rel = this.anchor.dataset['frugalPrefetch'] ?? '';
        const isExternal = rel.split(' ').includes('external');

        const navigate = this.anchor.dataset['frugalNavigate'];
        const shouldNavigate = this.config.defaultNavigate
            ? navigate !== 'false'
            : navigate === 'true';

        return shouldNavigate && !isExternal && utils.isInternalUrl(this.url);
    }

    async navigate() {
        if (!this.shouldNavigate()) {
            return;
        }

        try {
            dispatchEvent(
                new CustomEvent('frugal:readystatechange', {
                    detail: { readystate: 'loading' },
                }),
            );

            const html = await this.fetch();
            const nextDocument = new DOMParser().parseFromString(
                html,
                'text/html',
            );
            new Renderer(nextDocument).render();
            history.pushState(null, '', this.url);

            dispatchEvent(
                new CustomEvent('frugal:readystatechange', {
                    detail: { readystate: 'interactive' },
                }),
            );

            if (this.url.hash.startsWith('#')) {
                const scrollTarget = document.querySelector(this.url.hash);
                if (scrollTarget !== null) {
                    scrollTarget.scrollIntoView();
                }
            }

            dispatchEvent(
                new CustomEvent('frugal:readystatechange', {
                    detail: { readystate: 'complete' },
                }),
            );
        } catch (error: unknown) {
            console.error(error);
            location.href = this.url.href;
        }
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
    let hasRunForInitialLoad = false;
    if (readyStateOrder[document.readyState] > readyStateOrder[readyState]) {
        if (!hasRunForInitialLoad) {
            callback();
            hasRunForInitialLoad = true;
        }
    } else {
        document.addEventListener('readystatechange', () => {
            if (document.readyState === readyState) {
                if (!hasRunForInitialLoad) {
                    callback();
                    hasRunForInitialLoad = true;
                }
            }
        });

        addEventListener(
            'frugal:readystatechange',
            (event) => {
                if (event.detail.readystate === readyState) {
                    callback();
                }
            },
        );
    }
}
