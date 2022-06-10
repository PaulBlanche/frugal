export class LiveReloadClient {
    #url: string;
    #retry: number;

    constructor(url: string) {
        this.#url = url;
        this.#retry = 0;

        this.#connect();
    }

    #connect() {
        const source = new EventSource(this.#url);

        source.addEventListener('error', () => {
            source.close();
            const wait = Math.floor((1 - Math.exp(-this.#retry / 100)) * 2000);
            console.log(
                `Unable to connect to live reload server, retry in ${wait} ms`,
            );
            setTimeout(() => {
                this.#retry += 1;
                this.#connect();
            }, wait);
        });

        source.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'reload') {
                setTimeout(() => location.reload(), 10);
            }
        });

        source.addEventListener('open', () => {
            console.log('Connected to live reload server');
            this.#retry = 0;
        });

        addEventListener('beforeunload', () => {
            source.close();
        });
    }
}
