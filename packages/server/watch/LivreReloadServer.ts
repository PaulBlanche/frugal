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

    #dispatchMessage(message: { type: 'suspend' | 'reload' }) {
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
