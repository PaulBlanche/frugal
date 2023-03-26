import * as http from '../../dep/std/http.ts';
import { Config } from '../Config.ts';
import { Router } from '../page/Router.ts';
import { composeMiddleware } from './composeMiddleware.ts';
import { log } from '../log.ts';
import * as serverLog from './serverLog.ts';
import { StaticFileServer } from './StaticFileServer.ts';
import { ServeOptions, Server } from './Server.ts';
import { Session } from './Session.ts';
import { Context } from './Context.ts';
import { router } from './middlewares/router.ts';

export class FrugalServer implements Server {
    #config: Config;
    #router: Router;
    #staticFileHandler: http.Handler;

    constructor(config: Config, router: Router) {
        this.#config = config;
        this.#router = router;

        const staticFileServer = new StaticFileServer(config);
        this.#staticFileHandler = staticFileServer.handler();
    }

    handler(secure?: boolean): http.Handler {
        const composedMiddleware = composeMiddleware<Context>(
            ...this.#config.server.middlewares,
            router,
        );

        const middleware = composeMiddleware(
            composedMiddleware,
            ({ request, connInfo }) => {
                return this.#staticFileHandler(request, connInfo);
            },
        );

        const next = () => {
            return Promise.resolve(
                new Response(null, {
                    status: http.Status.NotFound,
                    statusText: http.STATUS_TEXT[http.Status.NotFound],
                }),
            );
        };

        return async (request, connInfo) => {
            const identifier = await serverLog.identifier(request, connInfo);
            const identifiedLog = serverLog.identifiedLog(identifier);

            identifiedLog(
                `${identifier.remoteHostname} [${identifier.method}] ${identifier.url}`,
                {
                    scope: 'DynamicServer',
                    kind: 'debug',
                },
            );

            try {
                const session = await Session.restore(
                    request.headers,
                    this.#config,
                    identifiedLog,
                );

                const response = await middleware({
                    request,
                    connInfo,
                    config: this.#config,
                    state: {},
                    secure: secure ?? false,
                    session,
                    router: this.#router,
                    log: identifiedLog,
                }, next);

                await session?.attach(response.headers);

                identifiedLog(
                    `[${identifier.method}] ${identifier.url} ${response.status}`,
                    {
                        scope: 'DynamicServer',
                    },
                );

                return response;
            } catch (error) {
                identifiedLog(error, { scope: 'DynamicServer' });

                return new Response(null, {
                    status: http.Status.InternalServerError,
                    statusText: http.STATUS_TEXT[http.Status.InternalServerError],
                });
            }
        };
    }

    serve({ onListen, signal }: ServeOptions = {}) {
        const secure = this.#config.server.secure;
        const handler = this.handler(secure);
        return http.serve(handler, {
            port: this.#config.server.port,
            signal,
            onListen: (args) => {
                onListen?.(args);
                const protocol = secure ? 'https' : 'http';
                log(
                    `listening on ${protocol}://${args.hostname}:${args.port}`,
                    { scope: 'DynamicServer' },
                );
            },
        });
    }
}
