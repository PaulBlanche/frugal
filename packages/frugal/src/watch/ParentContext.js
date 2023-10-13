import * as watchProcess from "./WatchProcess.js";
import { LiveReloadServer } from "./livereload/LiveReloadServer.js";

export class ParentContext {
    /** @type {AbortController} */
    #liveReloadController;
    /** @type {LiveReloadServer} */
    #liveReloadServer;
    /** @type {watchProcess.WatchProcess} */
    #watchProcess;
    /** @type {watchProcess.Listener[]} */
    #listeners;

    constructor() {
        this.#liveReloadController = new AbortController();
        this.#liveReloadServer = new LiveReloadServer();
        this.#watchProcess = new watchProcess.WatchProcess();
        this.#listeners = [];
    }

    /** @param {watchProcess.Listener} listener */
    addEventListener(listener) {
        this.#listeners.push(listener);
    }

    /** @param {watchProcess.Listener} listener */
    removeEventListener(listener) {
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
