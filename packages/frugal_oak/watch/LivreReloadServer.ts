import * as oak from 'oak';

export class LiveReloadServer {
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
