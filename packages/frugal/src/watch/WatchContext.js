import * as process from "../../dependencies/process.js";

import { FrugalConfig } from "../Config.js";
import { RuntimeWatchCache } from "../cache/RuntimeWatchCache.js";
import { ChildContext } from "./ChildContext.js";
import { ParentContext } from "./ParentContext.js";
import * as watchProcess from "./WatchProcess.js";

export class WatchContext {
    /** @type {ParentContext | ChildContext} */
    #context;

    /**
     * @param {FrugalConfig} config
     * @param {RuntimeWatchCache} watchCache
     * @returns
     */
    static create(config, watchCache) {
        if (isInChildWatchProcess()) {
            return new WatchContext(new ChildContext(config, watchCache));
        }
        return new WatchContext(new ParentContext());
    }

    /** @param {ParentContext | ChildContext} context */
    constructor(context) {
        this.#context = context;
    }

    /** @param {watchProcess.Listener} listener */
    addEventListener(listener) {
        if (this.#context instanceof ParentContext) {
            this.#context.addEventListener(listener);
        }
    }

    /** @param {watchProcess.Listener} listener */
    removeEventListener(listener) {
        if (this.#context instanceof ParentContext) {
            this.#context.removeEventListener(listener);
        }
    }

    /**
     * @param {watchProcess.WatchOptions} [options]
     * @returns
     */
    watch(options) {
        return this.#context.watch(options);
    }

    dispose() {
        return this.#context.dispose();
    }
}

export function isInChildWatchProcess() {
    return process.env.get("FRUGAL_WATCH_PROCESS_CHILD") !== undefined;
}
