import { Navigator, SerializedNavigator } from "./Navigator.ts";
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

        const restoredHistory = restoreHistory();
        if (restoredHistory) {
            HistoryInternal.instance = HistoryInternal.deserialize(restoredHistory, config);
        } else {
            HistoryInternal.instance = new HistoryInternal(config);
        }
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

type SerializedHistory = {
    stack: SerializedNavigator[];
    index: number;
    current: number;
};

class HistoryInternal {
    _stack: Navigator[];
    _index: number;
    _minIndex: number;
    _current: number;
    _observing: boolean;
    _config: NavigatorConfig;

    static instance?: HistoryInternal;

    static deserialize({ stack, index, current }: SerializedHistory, config: NavigatorConfig) {
        const history = new HistoryInternal(config);
        history._stack = stack.map((serialized) => Navigator.deserialize(serialized, config));
        history._index = index;
        history._current = current;

        const entries = performance.getEntriesByType("navigation");
        console.log(entries);
        switch (entries[0].type) {
            case "navigate": {
                if (history._index === history._current) {
                    history._stack.push(new Navigator(new URL(location.href), config));
                    history._current += 1;
                } else {
                    history._stack = history._stack.slice(0, history._current + 1);
                    history._stack[history._current] = new Navigator(
                        new URL(location.href),
                        config,
                    );
                }
                break;
            }
            case "back_forward": {
                if (history._index === history._current) {
                    history._current += 1;
                }
            }
        }

        history._minIndex = history._stack.length - 1;

        return history;
    }

    constructor(config: NavigatorConfig) {
        this._config = config;
        this._stack = [new Navigator(new URL(location.href), this._config)];
        this._index = 0;
        this._current = 0;
        this._minIndex = 0;
        this._observing = false;
    }

    serialize(): SerializedHistory {
        return {
            stack: this._stack.map((navigator) => navigator.serialize()),
            index: this._index,
            current: this._current,
        };
    }

    observe() {
        if (this._observing) {
            return;
        }
        this._observing = true;

        addEventListener("beforeunload", () => {
            console.log("beforeunload");
            persistHistory(this.serialize());
        });

        addEventListener("popstate", (event) => {
            console.log("popstate", event.state);
            this._index = this._current;

            const previous = this._stack[this._index];
            const nextIndex = event.state?.index ?? this._minIndex;
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
            this._current = this._index;
            if (this._index === this._minIndex) {
                this._index -= 1;
            }

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
        this._index = this._current;
        const stackIndex = this._index + 1;
        this._stack = this._stack.slice(0, stackIndex);
        this._stack.push(navigator);
        this._index = stackIndex;
        this._current = this._index;
        console.log("push", { index: this._index });
        history.pushState({ index: this._index }, "", navigator.url);
    }
}

const SERIALIZED_HISTORY_KEY = "frugal_browsersession_history";

function persistHistory(serializedHistory: SerializedHistory) {
    console.log("save", JSON.stringify(serializedHistory, null, 2));
    sessionStorage.setItem(SERIALIZED_HISTORY_KEY, JSON.stringify(serializedHistory));
}

function restoreHistory(): SerializedHistory | undefined {
    const persistedHistory = sessionStorage.getItem(SERIALIZED_HISTORY_KEY);
    if (persistedHistory) {
        return JSON.parse(persistedHistory);
    }
}
