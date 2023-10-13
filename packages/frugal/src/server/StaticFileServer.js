import * as path from "../../dependencies/path.js";
import * as http from "../../dependencies/http.js";

import { FrugalConfig } from "../Config.js";
import { log } from "../log.js";
import * as server from "./Server.js";

const ONE_YEAR_IN_SECONDS = 31536000;

/** @implements {server.Server} */
export class StaticFileServer {
    /** @type {FrugalConfig} */
    #config;

    /** @param {FrugalConfig} config */
    constructor(config) {
        this.#config = config;
    }

    /**
     * @param {boolean} [_secure]
     * @returns {http.Handler}
     */
    handler(_secure) {
        return async (request) => {
            const response = await http.send(request, { rootDir: this.#config.publicdir });

            if (!response.ok) {
                return response;
            }

            const headers = new Headers(response.headers);
            headers.set("Cache-Control", `max-age=${ONE_YEAR_IN_SECONDS}, immutable`);

            return new Response(response.body, {
                headers,
                status: response.status,
                statusText: response.statusText,
            });
        };
    }

    /**
     * @param {http.ServeOptions} [param0]
     * @returns
     */
    serve({ onListen, signal, port = 8000 } = {}) {
        const secure = this.#config.server.secure;
        const handler = this.handler(secure);
        return http.serve(
            async (request, info) => {
                const response = await handler(request, info);

                const normalizedUrl = path.normalize(
                    decodeURIComponent(new URL(request.url).pathname),
                );

                log(`[${request.method}] ${normalizedUrl} ${response.status}`, {
                    scope: "StaticServer",
                    level: response.status < 400 ? "info" : "error",
                });

                return response;
            },
            {
                port,
                signal,
                onListen: (args) => {
                    const protocol = secure ? "https" : "http";
                    log(`listening on ${protocol}://${args.hostname}:${args.port}`, {
                        scope: "StaticServer",
                    });
                    onListen?.(args);
                },
            },
        );
    }
}
