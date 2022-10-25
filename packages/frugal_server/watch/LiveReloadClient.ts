import { Navigator } from '../../frugal_session/Navigator.ts';

enum LiveReloadStatus {
    CONNECTED,
    PRISTINE,
    SUSPENDED,
    ERROR,
}

const SCOPE = `livereload-status-${
    Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36)
}`;

export class LiveReloadClient {
    #url: string;
    #retry: number;
    #status: Status;

    constructor(url: string) {
        this.#url = url;
        this.#retry = 0;

        this.#status = new Status();
        this.#connect();
    }

    #connect() {
        const source = new EventSource(this.#url);

        source.addEventListener('error', () => {
            this.#status.update(LiveReloadStatus.ERROR);
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
                setTimeout(() => {
                    new Navigator(new URL(location.href), {
                        defaultNavigate: true,
                        timeout: 0,
                        resetScroll: false,
                        restoreScroll: false,
                    }).navigate({ cache: 'no-store' });
                }, 10);
            }
            if (message.type === 'suspend') {
                this.#status.update(LiveReloadStatus.SUSPENDED);
            }
        });

        source.addEventListener('open', () => {
            console.log('Connected to live reload server');
            this.#retry = 0;
            this.#status.update(LiveReloadStatus.CONNECTED);
        });

        addEventListener('beforeunload', () => {
            source.close();
        });
    }
}

class Status {
    #container: HTMLDivElement;
    #tooltip: HTMLDivElement;
    #indicator: HTMLSpanElement;
    #status: LiveReloadStatus;

    constructor() {
        this.#status = LiveReloadStatus.PRISTINE;
        this.#setupStyles();

        const { container, tooltip, indicator } = this.#setupDom();
        this.#container = container;
        this.#tooltip = tooltip;
        this.#indicator = indicator;

        this.update(LiveReloadStatus.PRISTINE);
    }

    #setupStyles() {
        const style = document.createElement('style');
        document.head.appendChild(style);

        const styleSheet = style.sheet;

        if (styleSheet !== null) {
            styleSheet.insertRule(`.${SCOPE}.container {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 40px;
    height: 40px;
    font-size: 12px;
    display: none;
}`);

            styleSheet.insertRule(`.${SCOPE}.container .indicator {
    width: 20px;
    height: 20px;
    margin: 10px;  
    background: transparent;
    border-radius: 10px;
    line-height: 20px;
    text-align: center;
    background: #db3c30;
    color: #fff;
    display: block;
}`);

            styleSheet.insertRule(`.${SCOPE}.container.error, 
.${SCOPE}.container.suspend {
    display: block;
}`);

            styleSheet.insertRule(`.${SCOPE}.container.error .indicator {
    background: #db3c30;
    color: #fff;
}`);

            styleSheet.insertRule(`.${SCOPE}.container.suspend .indicator {
    background: #ffcd4c;
    animation: blink 0.2s linear infinite alternate
}`);
            styleSheet.insertRule(`@keyframes blink {
    from { opacity: 0.5 }
    to { opacity: 1 }
}`);
            styleSheet.insertRule(`.${SCOPE}.container .tooltip {
    position: absolute;
    display: block;
    width: fit-content;
    transform: translate(-100%, -50%);
    background: #282323;
    left: 5px;
    top: 50%;
    padding: 0px 5px;
    white-space: pre;
    color: #fff;
    padding: 2px 7px;
    border-radius: 4px;
}`);
            styleSheet.insertRule(`.${SCOPE}.container .tooltip::after {
    content: "";
    display: block;
    width: 10px;
    height: 10px;
    position: absolute;
    right: 0;
    transform: translate(100%, -50%);
    top: 50%;
    border: 5px solid transparent;
    border-left: 5px solid #282323;
}`);
            styleSheet.insertRule(`.${SCOPE}.container:not(:hover) .tooltip {
    display: none;
}`);
        }
    }

    #setupDom() {
        const container = document.createElement('div');
        container.classList.add(SCOPE, 'container');

        const tooltip = document.createElement('div');
        tooltip.classList.add('tooltip');

        container.appendChild(tooltip);

        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        container.appendChild(indicator);

        document.body.appendChild(container);

        return { container, tooltip, indicator };
    }

    update(status: LiveReloadStatus) {
        if (this.#status === status) {
            return;
        }
        this.#status = status;

        switch (this.#status) {
            case LiveReloadStatus.ERROR:
                {
                    this.#container.classList.add('error');
                    this.#indicator.textContent = '!';
                    this.#tooltip.textContent =
                        'Unable to connect to live reload server';
                }
                break;

            case LiveReloadStatus.SUSPENDED:
                {
                    this.#container.classList.add('suspend');
                    this.#indicator.textContent = ' ';
                    this.#tooltip.textContent = 'Page will soon reload';
                }
                break;

            default: {
                this.#container.classList.remove('suspend');
                this.#container.classList.remove('error');
            }
        }
    }
}
