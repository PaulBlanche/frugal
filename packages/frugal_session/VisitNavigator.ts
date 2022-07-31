import { Navigator, NavigatorConfig } from './Navigator.ts';
import * as utils from './utils.ts';
import { SessionHistory } from './SessionHistory.ts';

export class VisitNavigator {
    anchor: HTMLAnchorElement;
    #navigator: Navigator;
    #history: SessionHistory;

    constructor(
        anchor: HTMLAnchorElement,
        navigator: Navigator,
        config: NavigatorConfig,
    ) {
        this.#navigator = navigator;
        this.anchor = anchor;
        this.#history = SessionHistory.getInstance(config);
    }

    shouldHandleNavigate() {
        const rel = this.anchor.rel ?? '';
        const isExternal = rel.split(' ').includes('external');

        const navigate = this.anchor.dataset['frugalNavigate'];

        return this.#navigator._shouldNavigate(navigate) && !isExternal &&
            utils.isInternalUrl(this.#navigator.url);
    }

    async navigate() {
        if (!this.shouldHandleNavigate()) {
            this.#navigator._realNavigate();
            return;
        }

        this.#history.saveScroll();

        await this.#navigator.navigate();

        this.#history.push(this.#navigator);
    }
}
