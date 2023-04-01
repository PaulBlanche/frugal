enum LiveReloadStatus {
  CONNECTED,
  PRISTINE,
  SUSPENDED,
  ERROR,
}

export class LiveReloadClient {
  #url: string;
  #retry: number;
  #status: LiveReloadStatus;

  constructor(url: string) {
    this.#url = url;
    this.#retry = 0;
    this.#status = LiveReloadStatus.PRISTINE;

    this.#connect();
  }

  #setStatus(status: LiveReloadStatus) {
    this.#status = status;
  }

  #connect() {
    const source = new EventSource(this.#url);

    source.addEventListener('error', () => {
      this.#setStatus(LiveReloadStatus.ERROR);
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

      switch (message.type) {
        case 'reload': {
          location.reload();
          break;
        }
        case 'suspend': {
          this.#setStatus(LiveReloadStatus.SUSPENDED);
        }
      }
    });

    source.addEventListener('open', () => {
      console.log('Connected to live reload server');
      this.#retry = 0;
      this.#setStatus(LiveReloadStatus.CONNECTED);
    });

    addEventListener('beforeunload', () => {
      source.close();
    });
  }
}
