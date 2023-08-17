import * as http from "../../dep/std/http.ts";

import { FrugalConfig } from "../Config.ts";
import { RuntimeCache } from "../cache/Cache.ts";
import * as serverLog from "./serverLog.ts";
import { Router } from "../page/Router.ts";
import { Context } from "./Context.ts";
import { composeMiddleware, Middleware } from "./Middleware.ts";
import { ServeOptions, Server } from "./Server.ts";
import { StaticFileServer } from "./StaticFileServer.ts";
import { log } from "../log.ts";
import { route } from "./middleware/route.ts";
import { watchModeModifications } from "./middleware/watchModeModifications.ts";
import { trailingSlashRedirect } from "./middleware/trailingSlashRedirect.ts";
import * as session from "./session/mod.ts";

type FrugalServerInit = {
    cache: RuntimeCache;
    config: FrugalConfig;
    router: Router;
    watchMode: boolean;
};

export class FrugalServer implements Server {
    #config: FrugalConfig;
    #cache: RuntimeCache;
    #router: Router;
    #watchMode: boolean;
    #middleware: Middleware<Context>;
    #sessionManager?: session.SessionManager;

    constructor({ config, router, watchMode, cache }: FrugalServerInit) {
        this.#config = config;
        this.#router = router;
        this.#cache = cache;
        this.#watchMode = watchMode;

        if (config.server.session) {
            this.#sessionManager = new session.SessionManager(config.server.session);
        }

        const staticFileServer = new StaticFileServer(config);
        const staticFileHandler = staticFileServer.handler();

        this.#middleware = composeMiddleware<Context>(
            trailingSlashRedirect,
            ...this.#config.server.middlewares,
            watchModeModifications,
            route,
            ({ request, connInfo }) => {
                return staticFileHandler(request, connInfo);
            },
        );
    }

    handler(secure?: boolean): http.Handler {
        return async (request, connInfo) => {
            const identifier = await serverLog.identifier(request, connInfo);
            const identifiedLog = serverLog.identifiedLog(identifier);

            identifiedLog(
                `${identifier.remoteHostname} [${identifier.method}] ${identifier.url}`,
                {
                    scope: "FrugalServer",
                    level: "debug",
                },
            );

            try {
                const session = await this.#sessionManager?.get(request.headers);

                const response = await this.#middleware({
                    request,
                    resolve: (path: string) => this.#config.resolve(path),
                    connInfo,
                    config: this.#config,
                    state: {},
                    secure: secure ?? false,
                    router: this.#router,
                    watchMode: this.#watchMode,
                    log: identifiedLog,
                    cache: this.#cache,
                    session,
                }, mostInternalMiddleware);

                if (session) {
                    await this.#sessionManager?.persist(session, response.headers);
                }

                return response;
            } catch (error) {
                identifiedLog(error, { scope: "FrugalServer" });
                return new Response(null, {
                    status: http.Status.InternalServerError,
                    statusText: http.STATUS_TEXT[http.Status.InternalServerError],
                });
            }
        };
    }

    serve({ signal, onListen, port }: ServeOptions = {}) {
        const secure = this.#config.server.secure;
        const handler = this.handler(secure);

        return http.serve(handler, {
            port: port ?? this.#config.server.port,
            signal,
            onListen: (args) => {
                const protocol = secure ? "https" : "http";
                log(
                    `listening on ${protocol}://${args.hostname}:${args.port}`,
                    { scope: "FrugalServer" },
                );
                onListen?.(args);
            },
        });
    }
}

function mostInternalMiddleware() {
    return Promise.resolve(
        new Response(null, {
            status: http.Status.NotFound,
            statusText: http.STATUS_TEXT[http.Status.NotFound],
        }),
    );
}
