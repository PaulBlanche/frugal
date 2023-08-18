import { WatchProcess } from "./WatchProcess.ts";
import { LiveReloadServer } from "./livereload/LiveReloadServer.ts";

type EventType = "suspend" | "reload";

export type WatchOptions = {
    port?: number;
};

export type ParentContextListener = (type: EventType) => void;
export class ParentContext {
    #liveReloadController: AbortController;
    #liveReloadServer: LiveReloadServer;
    #watchProcess: WatchProcess;
    #listeners: ((event: EventType) => void)[];

    constructor() {
        this.#liveReloadController = new AbortController();
        this.#liveReloadServer = new LiveReloadServer();
        this.#watchProcess = new WatchProcess();
        this.#listeners = [];
    }

    addEventListener(listener: ParentContextListener) {
        this.#listeners.push(listener);
    }

    removeEventListener(listener: ParentContextListener) {
        const index = this.#listeners.indexOf(listener);
        if (index !== -1) {
            this.#listeners.splice(index, 1);
        }
    }

    async watch() {
        this.#watchProcess.addEventListener((type) => {
            this.#liveReloadServer.dispatch({ type });
            this.#listeners.forEach((listener) => listener(type));
        });

        await Promise.all([
            this.#liveReloadServer.serve({
                signal: this.#liveReloadController.signal,
            }),
            this.#watchProcess.spawn(),
        ]);
    }

    async dispose() {
        this.#liveReloadController.abort();
        await this.#watchProcess.kill();
    }
}
