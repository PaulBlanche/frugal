import { Navigator } from "./Navigator.ts";
import { NavigatorConfig } from "./Navigator.ts";
import { isUrlForSameDocument } from "./utils.ts";

declare global {
    interface WindowEventMap {
        "frugal:popstate": CustomEvent<{ navigator: Navigator }>;
    }
}

export class History {
    static init(config: NavigatorConfig) {
        if (HistoryInternal.instance !== undefined) {
            throw new Error("History was already initialised");
        }

        HistoryInternal.instance = new HistoryInternal(config);
    }

    static observe() {
        if (HistoryInternal.instance === undefined) {
            throw new Error("History must be initialised first");
        }

        return HistoryInternal.instance.observe();
    }

    static saveScroll() {
        if (HistoryInternal.instance === undefined) {
            throw new Error("History must be initialised first");
        }

        return HistoryInternal.instance.saveScroll();
    }

    static push(navigator: Navigator) {
        if (HistoryInternal.instance === undefined) {
            throw new Error("History must be initialised first");
        }

        return HistoryInternal.instance.push(navigator);
    }
}

class HistoryInternal {
    _stack: Navigator[];
    _index: number;
    _observing: boolean;
    _config: NavigatorConfig;
    _id: string;

    static instance?: HistoryInternal;

    constructor(config: NavigatorConfig) {
        this._config = config;
        this._stack = [new Navigator(new URL(location.href), this._config)];
        this._index = 0;
        this._observing = false;
        this._id = String(Math.random());
    }

    observe() {
        if (this._observing) {
            return;
        }
        this._observing = true;

        addEventListener("popstate", (event) => {
            const previous = this._stack[this._index];
            const nextIndex = event.state?.index ?? 0;
            const current = this._stack[nextIndex];

            if (previous === undefined || current === undefined) {
                return;
            }

            const previousUrl = previous.url;

            // if the url before the popstate event point inside the same
            // document (with a hash for exemple) we skip it and let the browser
            // do its thing
            if (isUrlForSameDocument(previousUrl, location.href)) {
                return;
            }

            this._index = nextIndex;

            event.preventDefault();

            previous.saveScroll();
            current.shouldRestoreScroll();

            dispatchEvent(
                new CustomEvent("frugal:popstate", {
                    detail: { navigator: current },
                }),
            );
        });
    }

    saveScroll() {
        const current = this._stack[this._index];
        current.saveScroll();
    }

    push(navigator: Navigator) {
        const stackIndex = this._index + 1;
        this._stack = this._stack.slice(0, stackIndex);
        this._stack.push(navigator);
        this._index = stackIndex;
        history.pushState({ index: stackIndex, id: this._id }, "", navigator.url);
    }
}
