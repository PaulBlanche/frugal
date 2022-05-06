import { Prefetcher, PrefetcherConfig } from './Prefetcher.ts';
import * as utils from './utils.ts';

export class PrefetchObserver {
    prefetchers: Map<string, Prefetcher>;
    config: PrefetcherConfig;

    constructor(config: PrefetcherConfig) {
        this.prefetchers = new Map();
        this.config = config;
    }

    observe() {
        const schedule = this.schedule.bind(this);
        const cancel = this.cancel.bind(this);
        addEventListener('mouseover', schedule, { capture: false });
        addEventListener('mouseout', cancel, { capture: false });

        return () => {
            removeEventListener('mouseover', schedule, { capture: false });
            removeEventListener('mouseout', cancel, { capture: false });
        };
    }

    schedule(event: MouseEvent) {
        if (event.target === null) {
            return;
        }

        const prefetcher = this.getPrefetcher(event.target);

        if (prefetcher === undefined) {
            return;
        }

        prefetcher.schedule();
    }

    cancel(event: MouseEvent) {
        if (event.target === null) {
            return;
        }

        const prefetcher = this.getPrefetcher(event.target);

        if (prefetcher === undefined) {
            return;
        }

        prefetcher.cancel();
    }

    getPrefetcher(target: EventTarget) {
        const navigableAnchor = utils.getClosestParentNavigableAnchor(target);
        if (navigableAnchor === undefined) {
            return;
        }

        const url = utils.getAnchorUrl(navigableAnchor);

        if (!this.prefetchers.has(url.href)) {
            const instance = new Prefetcher(url, navigableAnchor, this.config);
            this.prefetchers.set(url.href, instance);
        }

        return this.prefetchers.get(url.href);
    }
}
