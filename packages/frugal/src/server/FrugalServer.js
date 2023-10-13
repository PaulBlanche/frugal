import * as _type from "./_type/FrugalServer.js";
export * from "./_type/FrugalServer.js";

import * as http from "../../dependencies/http.js";

import { FrugalConfig } from "../Config.js";
import * as cache from "../cache/Cache.js";
import * as router from "../page/Router.js";
import * as context from "./Context.js";
import * as middleware from "./Middleware.js";
import * as server from "./Server.js";
import { StaticFileServer } from "./StaticFileServer.js";
import { log } from "../log.js";
import { route } from "./middleware/route.js";
import { watchModeModifications } from "./middleware/watchModeModifications.js";
import { trailingSlashRedirect } from "./middleware/trailingSlashRedirect.js";
import { SessionManager } from "./session/SessionManager.js";

/** @implements {server.Server} */
export class FrugalServer {
    /** @type {FrugalConfig} */
    #config;
    /** @type {cache.RuntimeCache} */
    #cache;
    /** @type {router.Router} */
    #router;
    /** @type {boolean} */
    #watchMode;
    /** @type {middleware.Middleware<context.Context>} */
    #middleware;
    /** @type {SessionManager | undefined} */
    #sessionManager;

    /** @param {_type.FrugalServerInit} param0 */
    constructor({ config, router, watchMode, cache }) {
        this.#config = config;
        this.#router = router;
        this.#cache = cache;
        this.#watchMode = watchMode;

        if (config.server.session) {
            this.#sessionManager = new SessionManager(config.server.session);
        }

        const staticFileServer = new StaticFileServer(config);
        const staticFileHandler = staticFileServer.handler();

        this.#middleware = middleware.composeMiddleware(
            trailingSlashRedirect,
            ...this.#config.server.middlewares,
            watchModeModifications,
            route,
            ({ request, info }) => {
                return staticFileHandler(request, info);
            },
        );
    }

    /**
     * @param {boolean} [secure]
     * @returns {http.Handler}
     */
    handler(secure) {
        return async (request, info) => {
            /** @type {typeof log} */
            const identifiedLog = (messageOrError, config) => {
                log(messageOrError, {
                    ...config,
                    scope: `${config?.scope ?? "???"}:${info.identifier}`,
                });
            };

            identifiedLog(`${info.hostname} [${request.method}] ${request.url}`, {
                scope: "FrugalServer",
                level: "debug",
            });

            try {
                const session = await this.#sessionManager?.get(request.headers);

                /** @type {context.Context} */
                const context = {
                    request,
                    resolve: (path) => this.#config.resolve(path),
                    info,
                    config: this.#config,
                    state: {},
                    secure: secure ?? false,
                    router: this.#router,
                    watchMode: this.#watchMode,
                    log: identifiedLog,
                    cache: this.#cache,
                    session,
                };

                const response = await this.#middleware(
                    context,
                    // Most internal middleware called if no other middleware
                    // handled the request.
                    () => {
                        return Promise.resolve(
                            new Response(null, {
                                status: 400,
                            }),
                        );
                    },
                );

                if (session) {
                    await this.#sessionManager?.persist(session, response.headers);
                }

                return response;
            } catch (/** @type {any} */ error) {
                identifiedLog(error, { scope: "FrugalServer" });
                return new Response(null, {
                    status: 500,
                });
            }
        };
    }

    /**
     * @param {http.ServeOptions} [param0]
     * @returns
     */
    serve({ signal, onListen, port } = {}) {
        const secure = this.#config.server.secure;
        const handler = this.handler(secure);

        return http.serve(handler, {
            port: port ?? this.#config.server.port,
            signal,
            onListen: (args) => {
                const protocol = secure ? "https" : "http";
                log(`listening on ${protocol}://${args.hostname}:${args.port}`, {
                    scope: "FrugalServer",
                });
                onListen?.(args);
            },
        });
    }
}
