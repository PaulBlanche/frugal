import * as utils from './utils.ts';
import { Navigator, NavigatorConfig } from './Navigator.ts';
import { Visitor } from './Visitor.ts';

export class VisitObserver {
    #config: NavigatorConfig;
    #observing: boolean;

    constructor(config: NavigatorConfig) {
        this.#config = config;
        this.#observing = false;
    }

    observe() {
        if (this.#observing) {
            return;
        }
        this.#observing = true;

        const visit = this.visit.bind(this);
        const restore = this.restore.bind(this);
        addEventListener('click', visit, { capture: false });
        addEventListener('keypress', visit, { capture: false });
        addEventListener('frugal:popstate', restore, { capture: false });

        return () => {
            removeEventListener('click', visit, { capture: false });
            removeEventListener('keypress', visit, { capture: false });
            removeEventListener('frugal:popstate', restore, { capture: false });
        };
    }

    async restore(event: CustomEvent<{ navigator: Navigator }>) {
        const navigator = event.detail.navigator;
        await navigator.navigate();
    }

    async visit(event: MouseEvent | KeyboardEvent) {
        if (
            !event.cancelable ||
            event.defaultPrevented ||
            event.target === null ||
            (event instanceof MouseEvent &&
                !shouldMouseEventBeHandled(event)) ||
            (event instanceof KeyboardEvent &&
                !shouldKeyboardEventBeHandled(event))
        ) {
            return;
        }

        const navigableAnchor = utils.getClosestParentNavigableAnchor(
            event.target,
        );
        if (navigableAnchor === undefined) {
            return;
        }

        const url = utils.getUrl(navigableAnchor.href);

        const navigator = new Navigator(url, this.#config);
        const visitor = new Visitor(navigableAnchor, navigator);

        event.preventDefault();
        try {
            const result = await visitor.visit();
            if (!result) {
                window.location.href = url.href;
            }
        } catch (error) {
            console.error(error);
            window.location.href = url.href;
        }
    }
}

function shouldMouseEventBeHandled(event: MouseEvent) {
    return (!event.ctrlKey && !event.altKey &&
        !event.shiftKey && !event.metaKey);
}

function shouldKeyboardEventBeHandled(event: KeyboardEvent) {
    return document.activeElement === event.target && event.key === 'Enter';
}
