import * as esbuild from "../../dependencies/esbuild.js";
import * as process from "../../dependencies/process.js";

import { EsbuildWrapper } from "../esbuild/EsbuildWrapper.js";
import { loadManifest } from "../Manifest.js";
import { RuntimeWatchCache } from "../cache/RuntimeWatchCache.js";
import { Router } from "../page/Router.js";
import { FrugalServer } from "../server/FrugalServer.js";
import { FrugalConfig } from "../Config.js";
import * as watchProcess from "./WatchProcess.js";

export const WATCH_MESSAGE_SYMBOL = Symbol("WATCH_MESSAGE_SYMBOL");

export class ChildContext {
    /** @type {EsbuildWrapper} */
    #builder;
    /** @type {esbuild.BuildContext | undefined} */
    #context;
    /** @type {RuntimeWatchCache} */
    #watchCache;
    /** @type {FrugalConfig} */
    #config;
    /** @type {AbortController} */
    #serverController;
    /** @type {number} */
    #port;

    /**
     * @param {FrugalConfig} config
     * @param {RuntimeWatchCache} watchCache
     */
    constructor(config, watchCache) {
        this.#config = config;
        this.#serverController = new AbortController();
        this.#watchCache = watchCache;
        this.#port = 3000;

        this.#builder = new EsbuildWrapper(config, [
            {
                name: "frugal-internal:watchEmitter",
                setup: (build) => {
                    build.onStart(() => {
                        console.log({
                            type: "suspend",
                            [WATCH_MESSAGE_SYMBOL]: true,
                        });
                    });

                    build.onEnd(async (result) => {
                        if (result.errors.length === 0) {
                            const server = await this.#getWatchServer();
                            this.#serverController.abort();
                            this.#serverController = new AbortController();
                            // leave time for address to be freed
                            setTimeout(() => {
                                server.serve({
                                    port: this.#port,
                                    signal: this.#serverController.signal,
                                    onListen: () => {
                                        console.log({
                                            type: "reload",
                                            [WATCH_MESSAGE_SYMBOL]: true,
                                        });
                                    },
                                });
                            });
                        }
                    });
                },
            },
        ]);
    }

    addEventListener() {}

    /**
     * @param {watchProcess.WatchOptions} [param0]
     * @returns
     */
    async watch({ port } = {}) {
        if (port !== undefined) {
            this.#port = port;
        }

        this.#patchLog();

        // cleanup when killing the child process
        process.addSignalListener("SIGINT", async () => {
            await this.dispose();
            process.exit();
        });

        this.#context = await this.#builder.context();

        return await this.#context.watch();
    }

    async dispose() {
        if (this.#context) {
            await this.#context.dispose();
        }
        this.#serverController.abort();
        esbuild.stop();
    }

    #patchLog() {
        const originalLog = console.log;
        console.log = (...args) => {
            if (
                typeof args[0] === "object" &&
                args[0] !== null &&
                WATCH_MESSAGE_SYMBOL in args[0]
            ) {
                originalLog(JSON.stringify(args[0]));
            } else {
                originalLog(...args);
            }
        };
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
}
