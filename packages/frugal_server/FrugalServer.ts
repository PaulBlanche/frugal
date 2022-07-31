import * as http from '../../dep/std/http.ts';

import * as frugal from '../core/mod.ts';
import * as log from '../log/mod.ts';

import { composeMiddleware } from './composeMiddleware.ts';
import { SessionManager } from './SessionManager.ts';
import { pageRouterMiddleware } from './middleware/pageRouterMiddleware.ts';
import { CleanConfig } from './Config.ts';
import { filesystemMiddleware } from './middleware/filesystemMiddleware.ts';
import { Context, Middleware } from './types.ts';

function logger() {
    return log.getLogger(`frugal_server:FrugalServer`);
}

export class FrugalServer {
    #config: CleanConfig;
    #frugal: frugal.Frugal;
    #middlewares: Middleware<Context>[];

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

    use(middleware: Middleware<Context>) {
        this.#middlewares.push(middleware);
    }

    #handler() {
        const sessionManager = new SessionManager(
            this.#config.sessionPersistance,
            this.#frugal,
        );

        const composedMiddleware = composeMiddleware(
            pageRouterMiddleware,
            filesystemMiddleware,
            ...this.#middlewares,
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
                const context = {
                    request,
                    connInfo,
                    config: this.#config,
                    sessionManager,
                    frugal: this.#frugal,
                };
                return await composedMiddleware(context, next);
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
