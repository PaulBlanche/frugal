import { FrugalConfig } from "../Config.ts";
import { WatchCache } from "../cache/WatchCache.ts";
import { Router } from "../page/Router.ts";
import { FrugalServer } from "../server/FrugalServer.ts";
import { WatchProcess } from "./WatchProcess.ts";
import { LiveReloadServer } from "./livereload/LiveReloadServer.ts";
import { loadManifest } from "../loadManifest.ts";

export class ParentContext {
    #config: FrugalConfig;
    #serverController: AbortController;
    #liveReloadController: AbortController;
    #liveReloadServer: LiveReloadServer;
    #watchProcess: WatchProcess;
    #watchCache: WatchCache;

    constructor(config: FrugalConfig) {
        this.#config = config;
        this.#serverController = new AbortController();
        this.#liveReloadController = new AbortController();
        this.#liveReloadServer = new LiveReloadServer();
        this.#watchProcess = new WatchProcess(this.#config);
        this.#watchCache = new WatchCache();
    }

    setup() {
        this.#watchProcess.addEventListener((type) => {
            if (type === "suspend") {
                this.#liveReloadServer.dispatch({ type });
            }
        });
    }

    async watch() {
        this.#watchProcess.addEventListener(async (type) => {
            switch (type) {
                case "reload":
                case "ready": {
                    const server = await this.#getWatchServer();
                    this.#serverController = new AbortController();
                    server.serve({
                        signal: this.#serverController.signal,
                        onListen: () => {
                            this.#liveReloadServer.dispatch({ type: "reload" });
                        },
                    });
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
        const manifest = await loadManifest(this.#config);

        const router = new Router({
            config: this.#config,
            manifest,
            cache: this.#watchCache,
        });

        for (const route of router.routes) {
            if (route.type === "static") {
                await route.generator.buildAll();
            }
        }

        return new FrugalServer({
            config: this.#config,
            router,
            cache: this.#watchCache,
            watchMode: true,
        });
    }

    dispose() {
        this.#liveReloadController.abort();
        this.#serverController.abort();
        this.#watchProcess.kill();
        return Promise.resolve();
    }
}
