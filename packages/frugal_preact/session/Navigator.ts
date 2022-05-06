import * as utils from './utils.ts';
import { Renderer } from './Renderer.ts';

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
            const html = await this.fetch();
            const nextDocument = new DOMParser().parseFromString(
                html,
                'text/html',
            );
            new Renderer(nextDocument).render();
            history.pushState(null, '', this.url);
            dispatchEvent(
                new CustomEvent('frugal:readystatechange', {
                    detail: { readystate: 'complete' },
                }),
            );
        } catch {
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
