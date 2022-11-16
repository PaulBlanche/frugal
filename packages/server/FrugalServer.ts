import * as http from '../../dep/std/http.ts';

import * as frugal from '../core/mod.ts';
import * as log from '../log/mod.ts';

import { composeMiddleware } from './composeMiddleware.ts';
import { pageRouterMiddleware } from './middleware/pageRouterMiddleware.ts';
import { CleanConfig } from './Config.ts';
import { filesystemMiddleware } from './middleware/filesystemMiddleware.ts';
import { Middleware } from './types.ts';
import { FrugalContext } from './middleware/types.ts';
import { statusRewriteMiddleware } from './middleware/statusRewriteMiddleware.ts';
import { Session } from './Session.ts';

function logger() {
    return log.getLogger(`frugal_server:FrugalServer`);
}

export class FrugalServer {
    #config: CleanConfig;
    #frugal: frugal.Frugal;
    #middlewares: Middleware<FrugalContext>[];

    constructor(config: CleanConfig, frugal: frugal.Frugal) {
        this.#config = config;
        this.#frugal = frugal;
        this.#middlewares = [];
    }

    listen() {
        return http.serve(this.#handler(), {
            ...this.#config,
            onListen: (params) => {
                logger().info({
                    hostname: params.hostname ?? 'localhost',
                    port: params.port,
                    msg() {
                        return `Listening on ${this.hostname}:${this.port}`;
                    },
                });

                if (this.#config.listen.onListen) {
                    this.#config.listen.onListen(params);
                }
            },
        });
    }

    use(middleware: Middleware<FrugalContext>) {
        this.#middlewares.push(middleware);
    }

    #handler() {
        const composedMiddleware = composeMiddleware(
            ...this.#middlewares,
            pageRouterMiddleware,
            filesystemMiddleware,
        );

        const middleware = composeMiddleware(
            statusRewriteMiddleware(composedMiddleware),
            composedMiddleware,
        );

        const next = () =>
            Promise.resolve(
                new Response(null, {
                    status: http.Status.NotFound,
                    statusText: http.STATUS_TEXT[http.Status.NotFound],
                }),
            );

        return async (request: Request, connInfo: http.ConnInfo) => {
            try {
                const session = await Session.restore(request, {
                    config: this.#config,
                    frugal: this.#frugal,
                });

                const response = await middleware({
                    request,
                    connInfo,
                    config: this.#config,
                    frugal: this.#frugal,
                    state: {},
                    session,
                }, next);

                await session.attach(response);

                return response;
            } catch (error) {
                logger().error({
                    msg() {
                        return `${error}`;
                    },
                }, error);

                return new Response(null, {
                    status: http.Status.InternalServerError,
                    statusText:
                        http.STATUS_TEXT[http.Status.InternalServerError],
                });
            }
        };
    }
}
