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

        // base style
        styleSheet?.insertRule(
            `.${scope} { position: fixed; z-index: 10000; width: 40px; height: 40px; right: 20px; bottom: 20px; pointer-events:none; }`,
        );
        styleSheet?.insertRule(
            `.${scope}.suspended, .${scope}.error { pointer-events: all }`,
        );

        // suspend styme
        styleSheet?.insertRule(
            "@keyframes suspended { 0% { opacity: 1; transform: scale(0); } 100% { opacity: 0; transform: scale(1); } }",
        );
        styleSheet?.insertRule(
            `.${scope}.suspended::after { animation-delay: 1s; }`,
        );
        styleSheet?.insertRule(
            `.${scope}.suspended::before,.${scope}.suspended::after { content: ''; position: absolute; inset: 0; background-color: black; border-radius: 50%; opacity: 1; transform: scale(0); animation: linear 2s infinite suspended; }`,
        );

        // error style
        styleSheet?.insertRule(
            "@keyframes error { 0% { opacity: 1; } 100% { opacity: 0.6; } }",
        );
        styleSheet?.insertRule(
            `.${scope}.error { background: rgb(204, 51, 0); border-radius: 50%; display: flex; justify-content: center; align-items: center; animation: linear 0.3s infinite alternate error; }`,
        );
        styleSheet?.insertRule(
            `.${scope}.error::before { content: "!"; color: white; font-weight: bold; font-size: 25px; }`,
        );

        this.#element = document.createElement("div");
        this.#element.classList.add(scope);
        document.body.append(this.#element);
    }

    setStatus(status: LiveReloadStatus) {
        switch (status) {
            case LiveReloadStatus.SUSPENDED: {
                this.#element?.classList.toggle("error", false);
                this.#element?.classList.toggle("suspended", true);
                this.#element?.setAttribute("title", "toto");
                break;
            }
            case LiveReloadStatus.CONNECTED: {
                this.#element?.classList.toggle("error", false);
                this.#element?.classList.toggle("suspended", false);
                this.#element?.removeAttribute("title");
                break;
            }
            case LiveReloadStatus.ERROR: {
                this.#element?.classList.toggle("error", true);
                this.#element?.classList.toggle("suspended", false);
                this.#element?.setAttribute("title", "tata");
                break;
            }
        }
    }
}
