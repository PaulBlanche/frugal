import { FrugalConfig } from "./Config.ts";
import { Builder } from "./build/Builder.ts";
import { RuntimeWatchCache } from "./cache/RuntimeWatchCache.ts";
import { ChildContext } from "./watch/ChildContext.ts";
import { ParentContext, ParentContextListener, WatchOptions } from "./watch/ParentContext.ts";

export class WatchContext {
    #context: ParentContext | ChildContext;

    static create(config: FrugalConfig, watchCache: RuntimeWatchCache) {
        if (isInChildWatchProcess()) {
            return new WatchContext(new ChildContext(new Builder(config)));
        }
        return new WatchContext(new ParentContext(config, watchCache));
    }

    constructor(context: ParentContext | ChildContext) {
        this.#context = context;
    }

    addEventListener(listener: ParentContextListener) {
        if (this.#context instanceof ParentContext) {
            this.#context.addEventListener(listener);
        }
    }

    removeEventListener(listener: ParentContextListener) {
        if (this.#context instanceof ParentContext) {
            this.#context.removeEventListener(listener);
        }
    }

    watch(options?: WatchOptions) {
        return this.#context.watch(options);
    }

    dispose() {
        return this.#context.dispose();
    }
}

export function isInChildWatchProcess() {
    return Deno.env.has("FRUGAL_WATCH_PROCESS_CHILD");
}
