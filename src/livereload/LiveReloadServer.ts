import * as http from '../../dep/std/http.ts';

import { log } from '../log.ts';
import { ServeOptions, Server } from '../server/Server.ts';

const ENCODER = new TextEncoder();

export class LiveReloadServer implements Server {
    #controllers: Map<number, ReadableStreamController<Uint8Array>>;

    constructor() {
        this.#controllers = new Map();
    }

    dispatch(event: { type: 'suspend' | 'reload' | 'connected' }) {
        log(`"${event.type}" event dispatched`, {
            scope: 'LiveReloadServer',
            kind: 'debug',
        });

        const payload = `data: ${JSON.stringify(event)}\n\n`;
        for (const [id, controller] of this.#controllers.entries()) {
            log(`dispatch "${event.type}" event to connection ${id}`, {
                scope: 'LiveReloadServer',
                kind: 'verbose',
            });

            controller.enqueue(ENCODER.encode(payload));
        }
    }

    handler(): http.Handler {
        let id = 0;
        return () => {
            const controllerId = id++;
            const body = new ReadableStream({
                start: (controller) => {
                    log(`open new livereload connection (id:${controllerId})`, {
                        scope: 'LiveReloadServer',
                        kind: 'verbose',
                    });
                    this.#controllers.set(controllerId, controller);
                    this.dispatch({ type: 'connected' });
                },
                cancel: (error) => {
                    if (
                        error instanceof Error &&
                        error.message.includes('connection closed')
                    ) {
                        const controller = this.#controllers.get(controllerId);
                        if (controller) {
                            log(
                                `close livereload connection (id:${controllerId})`,
                                {
                                    scope: 'LiveReloadServer',
                                    kind: 'verbose',
                                },
                            );
                            this.#controllers.delete(controllerId);
                            controller.close();
                        }
                    } else {
                        log(
                            `error on livereload connection (id:${controllerId})`,
                            {
                                kind: 'error',
                                extra: error,
                            },
                        );
                    }
                },
            });
            return new Response(body, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Connection': 'Keep-Alive',
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Keep-Alive': `timeout=${Number.MAX_SAFE_INTEGER}`,
                },
            });
        };
    }

    serve({ onListen, signal }: ServeOptions = {}) {
        const handler = this.handler();
        return http.serve(handler, {
            port: 4075,
            signal,
            onListen(args) {
                onListen?.(args);
                log(
                    `Live reload server listening at http://${args.hostname}:${args.port}`,
                    {
                        scope: 'LiveReloadServer',
                    },
                );
            },
        });
    }
}
