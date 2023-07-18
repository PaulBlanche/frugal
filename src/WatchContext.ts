import { FrugalConfig } from "./Config.ts";
import { Builder } from "./build/Builder.ts";
import { WatchCache } from "./cache/WatchCache.ts";
import { ChildContext } from "./watch/ChildContext.ts";
import { ParentContext, ParentContextListener } from "./watch/ParentContext.ts";

export class WatchContext {
    #context: ParentContext | ChildContext;

    static create(config: FrugalConfig, watchCache: WatchCache) {
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

    watch() {
        return this.#context.watch();
    }

    dispose() {
        return this.#context.dispose();
    }
}

export function isInChildWatchProcess() {
    return Deno.env.has("FRUGAL_WATCH_PROCESS_CHILD");
}
