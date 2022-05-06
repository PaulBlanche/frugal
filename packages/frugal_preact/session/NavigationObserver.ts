import * as utils from './utils.ts';
import { Navigator, NavigatorConfig } from './Navigator.ts';

export class NavigationObserver {
    config: NavigatorConfig;

    constructor(config: NavigatorConfig) {
        this.config = config;
    }

    observe() {
        const visit = this.visit.bind(this);
        addEventListener('click', visit, { capture: false });

        return () => {
            removeEventListener('click', visit, { capture: false });
        };
    }

    async visit(event: MouseEvent) {
        if (!shouldClickEventBeHandled(event) || event.target === null) {
            return;
        }

        const navigator = this.getNavigator(event.target);

        if (navigator === undefined) {
            return;
        }

        event.preventDefault();
        await navigator.navigate();
    }

    getNavigator(target: EventTarget) {
        const navigableAnchor = utils.getClosestParentNavigableAnchor(target);
        if (navigableAnchor === undefined) {
            return;
        }

        const url = utils.getAnchorUrl(navigableAnchor);

        return new Navigator(url, navigableAnchor, this.config);
    }
}

function shouldClickEventBeHandled(event: MouseEvent) {
    return (!event.defaultPrevented || event.ctrlKey || event.altKey ||
        event.shiftKey || event.metaKey);
}
