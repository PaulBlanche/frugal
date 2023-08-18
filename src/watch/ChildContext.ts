import * as esbuild from "../../dep/esbuild.ts";

import { Builder } from "../build/Builder.ts";
import { loadManifest } from "../Manifest.ts";
import { RuntimeWatchCache } from "../cache/RuntimeWatchCache.ts";
import { Router } from "../page/Router.ts";
import { FrugalServer } from "../server/FrugalServer.ts";
import { FrugalConfig } from "../Config.ts";
import { WatchOptions } from "./ParentContext.ts";

export const WATCH_MESSAGE_SYMBOL = Symbol("WATCH_MESSAGE_SYMBOL");

export class ChildContext {
    #builder: Builder;
    #context?: esbuild.BuildContext;
    #watchCache: RuntimeWatchCache;
    #config: FrugalConfig;
    #serverController: AbortController;
    #port: number;

    constructor(config: FrugalConfig, watchCache: RuntimeWatchCache) {
        this.#config = config;
        this.#serverController = new AbortController();
        this.#watchCache = watchCache;
        this.#port = 3000;

        this.#builder = new Builder(config, [{
            name: "__frugal_internal:watchEmitter",
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
        }]);
    }

    addEventListener() {}

    async watch({ port }: WatchOptions = {}) {
        if (port !== undefined) {
            this.#port = port;
        }

        this.#patchLog();

        // cleanup when killing the child process
        Deno.addSignalListener("SIGINT", async () => {
            await this.dispose();
            Deno.exit();
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
                typeof args[0] === "object" && args[0] !== null &&
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
