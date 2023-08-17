import * as http from "../../dep/std/http.ts";
import * as file_server from "../../dep/std/http/file_server.ts";
import * as path from "../../dep/std/path.ts";

import { FrugalConfig } from "../Config.ts";
import { log } from "../log.ts";
import { ServeOptions, Server } from "./Server.ts";

const ONE_YEAR_IN_SECONDS = 31536000;

export class StaticFileServer implements Server {
    #config: FrugalConfig;

    constructor(config: FrugalConfig) {
        this.#config = config;
    }

    handler(_secure?: boolean): http.Handler {
        return async (request, _connInfo) => {
            const response = await file_server.serveDir(request, {
                fsRoot: path.fromFileUrl(this.#config.publicdir),
                quiet: true,
            });

            const headers = new Headers(response.headers);
            headers.set("Cache-Control", `max-age=${ONE_YEAR_IN_SECONDS}, immutable`);

            return new Response(response.body, {
                headers,
                status: response.status,
                statusText: response.statusText,
            });
        };
    }

    serve({ onListen, signal, port = 8000 }: ServeOptions = {}) {
        const secure = this.#config.server.secure;
        const handler = this.handler(secure);
        return http.serve(async (request, connInfo) => {
            const response = await handler(request, connInfo);

            const normalizedUrl = path.posix.normalize(
                decodeURIComponent(new URL(request.url).pathname),
            );

            log(`[${request.method}] ${normalizedUrl} ${response.status}`, {
                scope: "StaticServer",
                level: response.status < 400 ? "info" : "error",
            });

            return response;
        }, {
            port,
            signal,
            onListen: (args) => {
                const protocol = secure ? "https" : "http";
                log(
                    `listening on ${protocol}://${args.hostname}:${args.port}`,
                    { scope: "StaticServer" },
                );
                onListen?.(args);
            },
        });
    }
}
