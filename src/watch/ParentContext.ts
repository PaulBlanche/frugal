import { FrugalConfig } from "../Config.ts";
import { loadManifest } from "../Manifest.ts";
import { RuntimeWatchCache } from "../cache/RuntimeWatchCache.ts";
import { Router } from "../page/Router.ts";
import { FrugalServer } from "../server/FrugalServer.ts";
import { WatchProcess } from "./WatchProcess.ts";
import { LiveReloadServer } from "./livereload/LiveReloadServer.ts";

type EventType = "ready";

export type WatchOptions = {
    port?: number;
};

export type ParentContextListener = (type: EventType) => void;
export class ParentContext {
    #config: FrugalConfig;
    #serverController: AbortController;
    #liveReloadController: AbortController;
    #liveReloadServer: LiveReloadServer;
    #watchProcess: WatchProcess;
    #watchCache: RuntimeWatchCache;
    #listeners: ((event: EventType) => void)[];

    constructor(config: FrugalConfig, watchCache: RuntimeWatchCache) {
        this.#config = config;
        this.#serverController = new AbortController();
        this.#liveReloadController = new AbortController();
        this.#liveReloadServer = new LiveReloadServer();
        this.#watchProcess = new WatchProcess(this.#config);
        this.#watchCache = watchCache;
        this.#listeners = [];

        this.#watchProcess.addEventListener((type) => {
            if (type === "suspend") {
                this.#liveReloadServer.dispatch({ type });
            }
        });
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

    async watch({ port = 3000 }: WatchOptions = {}) {
        this.#watchProcess.addEventListener(async (type) => {
            switch (type) {
                case "reload":
                case "ready": {
                    const server = await this.#getWatchServer();
                    this.#serverController = new AbortController();
                    server.serve({
                        port,
                        signal: this.#serverController.signal,
                        onListen: () => {
                            this.#liveReloadServer.dispatch({ type: "reload" });
                        },
                    });
                    this.#listeners.forEach((listener) => listener("ready"));
                    break;
                }
                case "suspend": {
                    this.#serverController.abort();
                    break;
                }
            }
        });

        await Promise.all([
            this.#liveReloadServer.serve({
                signal: this.#liveReloadController.signal,
            }),
            this.#watchProcess.spawn(),
        ]);
    }

    async #getWatchServer() {
        const router = new Router({
            config: this.#config,
            manifest: await loadManifest(this.#config),
            cache: this.#watchCache,
        });

        await router.buildAllStaticRoutes();

        return new FrugalServer({
            config: this.#config,
            router,
            cache: this.#watchCache,
            watchMode: true,
        });
    }

    async dispose() {
        this.#liveReloadController.abort();
        this.#serverController.abort();
        await this.#watchProcess.kill();
    }
}
