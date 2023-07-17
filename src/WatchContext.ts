import { FrugalConfig } from "./Config.ts";
import { Builder } from "./build/Builder.ts";
import { ChildContext } from "./watch/ChildContext.ts";
import { ParentContext } from "./watch/ParentContext.ts";

export class WatchContext {
    #context: ParentContext | ChildContext;

    static create(config: FrugalConfig) {
        if (isInChildWatchProcess()) {
            return new WatchContext(new ChildContext(new Builder(config)));
        }
        return new WatchContext(new ParentContext(config));
    }

    constructor(context: ParentContext | ChildContext) {
        this.#context = context;
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
