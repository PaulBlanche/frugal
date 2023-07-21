import { Navigator } from "./Navigator.ts";
import { NavigatorConfig } from "./Navigator.ts";

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

    static instance?: HistoryInternal;

    constructor(config: NavigatorConfig) {
        this._config = config;
        this._stack = [new Navigator(new URL(location.href), this._config)];
        this._index = 0;
        this._observing = false;
    }

    observe() {
        if (this._observing) {
            return;
        }
        this._observing = true;

        addEventListener("popstate", (event) => {
            event.preventDefault();

            const previous = this._stack[this._index];
            previous.saveScroll();

            this._index = event.state ?? 0;
            const current = this._stack[this._index];
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
        this._stack = this._stack.slice(0, this._index + 1);
        this._stack.push(navigator);
        this._index += 1;
        history.pushState(this._index, "", navigator.url);
    }
}
