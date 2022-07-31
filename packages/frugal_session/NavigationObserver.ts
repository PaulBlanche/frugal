import * as utils from './utils.ts';
import { Navigator, NavigatorConfig } from './Navigator.ts';
import { VisitNavigator } from './VisitNavigator.ts';

const NAVIGATION_OBSERVER_INSTANCE =
    `$$frugal$$navigation$$observer$$instance$$`;

declare global {
    interface Window {
        [NAVIGATION_OBSERVER_INSTANCE]?: NavigationObserver;
    }
}

export class NavigationObserver {
    #config: NavigatorConfig;
    #observing: boolean;

    static getInstance(config: NavigatorConfig) {
        return new NavigationObserver(config);
    }

    constructor(config: NavigatorConfig) {
        this.#config = config;
        this.#observing = false;

        if (window[NAVIGATION_OBSERVER_INSTANCE] !== undefined) {
            return window[NAVIGATION_OBSERVER_INSTANCE];
        }

        window[NAVIGATION_OBSERVER_INSTANCE] = this;
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
        console.log('restore', navigator);
        await navigator.navigate();
    }

    async visit(event: MouseEvent | KeyboardEvent) {
        if (
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

        const url = utils.getAnchorUrl(navigableAnchor);

        const navigator = new Navigator(url, this.#config);
        const visitNavigator = new VisitNavigator(
            navigableAnchor,
            navigator,
            this.#config,
        );

        event.preventDefault();
        await visitNavigator.navigate();
    }
}

function shouldMouseEventBeHandled(event: MouseEvent) {
    return (!event.defaultPrevented || event.ctrlKey || event.altKey ||
        event.shiftKey || event.metaKey);
}

function shouldKeyboardEventBeHandled(event: KeyboardEvent) {
    return document.activeElement === event.target && event.key === 'Enter';
}
