import { Status, STATUS_TEXT } from '../../dep/std/http/http_status.ts';

export class DataResponse<DATA> {
    #data: DATA;
    #renderer?: (data: DATA) => Promise<string>;
    _headers: Headers;
    _status: Status;

    constructor(data: DATA, responseInit?: ResponseInit) {
        this.#data = data;
        this._headers = new Headers(responseInit?.headers);
        this._status = responseInit?.status ?? Status.OK;
    }

    setRenderer(renderer: (data: DATA) => Promise<string>) {
        this.#renderer = renderer;
    }

    async render() {
        if (this.#renderer && this.#ok()) {
            const body = await this.#renderer(this.#data);
            return new FrugalResponse(this._headers, this._status, body);
        }

        return new FrugalResponse(this._headers, this._status);
    }

    #ok() {
        return Number(this._status) >= 200 && Number(this._status) <= 299;
    }

    get data() {
        return this.#data;
    }
}

export class EmptyResponse extends DataResponse<any> {
    constructor(responseInit?: ResponseInit) {
        super(null, responseInit);
    }

    render(): Promise<FrugalResponse> {
        return Promise.resolve(new FrugalResponse(this._headers, this._status));
    }
}

export type SerializedFrugalResponse = {
    body?: string;
    headers: [string, string][];
    status: Status;
};

export class FrugalResponse {
    #body?: string;
    #headers: Headers;
    #status: Status;

    static deserialize(serialized: SerializedFrugalResponse): FrugalResponse {
        const response = new FrugalResponse(
            new Headers(serialized.headers),
            serialized.status,
            serialized.body,
        );

        return response;
    }

    constructor(headers: Headers, status: Status, body?: string) {
        this.#body = body;
        this.#headers = headers;
        this.#status = status;
    }

    get body() {
        return this.#body;
    }

    get headers() {
        return this.#headers;
    }

    get status() {
        return this.#status;
    }

    serialize(): SerializedFrugalResponse {
        return {
            body: this.#body,
            headers: Array.from(this.#headers.entries()),
            status: this.#status,
        };
    }

    toResponse(): Response {
        return new Response(this.#body, {
            headers: this.#headers,
            status: this.#status,
            statusText: STATUS_TEXT[this.#status],
        });
    }
}
