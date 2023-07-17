enum LiveReloadStatus {
    CONNECTED,
    PRISTINE,
    SUSPENDED,
    ERROR,
}

export class LiveReloadClient {
    #url: string;
    #retry: number;
    #indicator: Indicator;

    constructor(url: string) {
        this.#url = url;
        this.#retry = 0;
        this.#indicator = new Indicator();

        this.#connect();
    }

    #setStatus(status: LiveReloadStatus) {
        this.#indicator.setStatus(status);
    }

    #connect() {
        const source = new EventSource(this.#url);

        source.addEventListener("error", () => {
            this.#setStatus(LiveReloadStatus.ERROR);
            source.close();

            const wait = Math.floor((1 - Math.exp(-this.#retry / 60)) * 2000);
            console.log(
                `Unable to connect to live reload server, retry in ${wait} ms`,
            );

            setTimeout(() => {
                this.#retry += 1;
                this.#connect();
            }, wait);
        });

        source.addEventListener("message", (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case "reload": {
                    location.reload();
                    break;
                }
                case "suspend": {
                    this.#setStatus(LiveReloadStatus.SUSPENDED);
                }
            }
        });

        source.addEventListener("open", () => {
            console.log("Connected to live reload server");
            this.#retry = 0;
            this.#setStatus(LiveReloadStatus.CONNECTED);
        });

        addEventListener("beforeunload", () => {
            source.close();
        });
    }
}

const UNIQUE_ID = String(Math.random()).replace(".", "");
const scope = `livereload-${UNIQUE_ID}`;

class Indicator {
    #element?: HTMLElement;

    constructor() {
        this.#setupDOM();
    }

    #setupDOM() {
        if (typeof document === "undefined") {
            return;
        }

        const styleElement = document.createElement("style");
        document.head.appendChild(styleElement);

        const styleSheet = styleElement.sheet;

        styleSheet?.insertRule("@keyframes blink { 0% { opacity:0; } 100% { opacity: 1 } }");
        styleSheet?.insertRule(`.${scope} { position: fixed; inset:0; pointer-events: none; z-index: 10000; }`);
        styleSheet?.insertRule(`.${scope}.blink { animation: 0.3s infinite alternate blink; }`);
        styleSheet?.insertRule(`.${scope}.suspended { background: #0002; }`);
        styleSheet?.insertRule(`.${scope}.error { background: #f332; }`);

        this.#element = document.createElement("div");
        this.#element.classList.add(scope);
        document.body.append(this.#element);
    }

    setStatus(status: LiveReloadStatus) {
        switch (status) {
            case LiveReloadStatus.SUSPENDED: {
                this.#element?.classList.toggle("error", false);
                this.#element?.classList.toggle("suspended", true);
                this.#element?.classList.toggle("blink", true);
                break;
            }
            case LiveReloadStatus.CONNECTED: {
                this.#element?.classList.toggle("error", false);
                this.#element?.classList.toggle("suspended", false);
                this.#element?.classList.toggle("blink", false);
                break;
            }
            case LiveReloadStatus.ERROR: {
                this.#element?.classList.toggle("error", true);
                this.#element?.classList.toggle("suspended", false);
                this.#element?.classList.toggle("blink", true);
                break;
            }
        }
    }
}
