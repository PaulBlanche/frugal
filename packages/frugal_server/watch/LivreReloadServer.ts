import * as http from '../../../dep/std/http.ts';

const ENCODER = new TextEncoder();

export class LiveReloadServer {
    #controllers: Map<number, ReadableStreamController<Uint8Array>>;
    constructor() {
        this.#controllers = new Map();
    }

    suspend() {
        this.#dispatchMessage({ type: 'suspend' });
    }

    reload() {
        this.#dispatchMessage({ type: 'reload' });
    }

    #dispatchMessage(message: any) {
        const payload = `data: ${JSON.stringify(message)}\n\n`;
        for (const controller of this.#controllers.values()) {
            controller.enqueue(ENCODER.encode(payload));
        }
    }

    listen() {
        let id = 0;
        return http.serve(() => {
            const controllerId = id++;
            const body = new ReadableStream({
                start: (controller) => {
                    this.#controllers.set(controllerId, controller);
                },
                cancel: (error) => {
                    if (
                        error instanceof Error &&
                        error.message.includes('connection closed')
                    ) {
                        const controller = this.#controllers.get(controllerId);
                        if (controller) {
                            this.#controllers.delete(controllerId);
                            controller.close();
                        }
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
        }, {
            port: 4075,
            onListen({ hostname = 'localhost', port }) {
                console.log(
                    `Live reload server listening on: ${hostname}:${port}`,
                );
            },
        });
    }
}

/*
export class LiveReloadServerOld {
    #application: oak.Application;
    #targets: oak.ServerSentEventTarget[];

    constructor() {
        this.#application = new oak.Application();
        const router = new oak.Router();

        this.#targets = [];

        router.get('/sse', (context) => {
            this.#handleOpenConnection(context);
        });

        this.#application.use(router.routes(), router.allowedMethods());
    }

    #handleOpenConnection(context: oak.Context) {
        const target = context.sendEvents({
            headers: new Headers({
                'Access-Control-Allow-Origin': '*',
            }),
        });

        target.addEventListener('close', () => {
            const index = this.#targets.indexOf(target);
            if (index !== -1) {
                this.#targets.splice(index, 1);
            }
        });

        this.#targets.push(target);
    }

    stop() {
        for (const target of this.#targets) {
            target.dispatchMessage({ type: 'stop' });
        }
    }

    reload() {
        for (const target of this.#targets) {
            target.dispatchMessage({ type: 'reload' });
        }
    }

    listen() {
        this.#application.addEventListener(
            'listen',
            ({ hostname, port, secure }) => {
                console.log(
                    `Live reload server listening on: ${
                        secure ? 'https://' : 'http://'
                    }${hostname ?? 'localhost'}:${port}`,
                );
            },
        );

        return this.#application.listen({ port: 4075 });
    }
}
*/
