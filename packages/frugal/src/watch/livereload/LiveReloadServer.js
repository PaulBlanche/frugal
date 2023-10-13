import * as http from "../../../dependencies/http.js";

import { log } from "../../log.js";
import * as server from "../../server/Server.js";

const ENCODER = new TextEncoder();

/** @implements {server.Server} */
export class LiveReloadServer {
    /** @type {Map<number, ReadableStreamController<Uint8Array>>} */
    #controllers;

    constructor() {
        this.#controllers = new Map();
    }

    /** @param {{ type: "suspend" | "reload" | "connected" }} event */
    dispatch(event) {
        log(`"${event.type}" event dispatched`, {
            scope: "LiveReloadServer",
            level: "debug",
        });

        const payload = `data: ${JSON.stringify(event)}\n\n`;
        for (const [id, controller] of this.#controllers.entries()) {
            log(`dispatch "${event.type}" event to connection ${id}`, {
                scope: "LiveReloadServer",
                level: "verbose",
            });

            controller.enqueue(ENCODER.encode(payload));
        }
    }

    /** @returns {http.Handler} */
    handler() {
        let id = 0;
        return () => {
            const controllerId = id++;
            /** @satisfies {UnderlyingSource<Uint8Array>} */
            const source = {
                start: (controller) => {
                    log(`open new livereload connection (id:${controllerId})`, {
                        scope: "LiveReloadServer",
                        level: "verbose",
                    });
                    this.#controllers.set(controllerId, controller);
                    this.dispatch({ type: "connected" });
                },
                cancel: (error) => {
                    if (error instanceof Error && error.message.includes("connection closed")) {
                        const controller = this.#controllers.get(controllerId);
                        if (controller) {
                            log(`close livereload connection (id:${controllerId})`, {
                                scope: "LiveReloadServer",
                                level: "verbose",
                            });
                            this.#controllers.delete(controllerId);
                            controller.close();
                        }
                    } else {
                        log(`error on livereload connection (id:${controllerId})`, {
                            level: "error",
                            extra: error,
                        });
                    }
                },
            };

            const response = /** @type {http.EventStreamResponse} */ (
                new Response(new ReadableStream(source), {
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        Connection: "Keep-Alive",
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Keep-Alive": `timeout=${Number.MAX_SAFE_INTEGER}`,
                    },
                })
            );

            response.close = () => {
                source.cancel(new Error("connection closed"));
            };

            return response;
        };
    }

    /**
     * @param {http.ServeOptions} [param0]
     * @returns
     */
    serve({ onListen, signal, port = 4075 } = {}) {
        const handler = this.handler();
        return http.serve(handler, {
            port,
            signal,
            onListen(args) {
                onListen?.(args);
                log(`Live reload server listening at http://${args.hostname}:${args.port}`, {
                    scope: "LiveReloadServer",
                });
            },
        });
    }
}
