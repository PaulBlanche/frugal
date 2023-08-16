import * as http from "../../dep/std/http.ts";
import { hashableJsonValue, type JSONValue } from "./JSONValue.ts";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

export type PageResponse<DATA extends JSONValue> = EmptyResponse | DataResponse<DATA>;

type ResponseInit = {
    headers?: HeadersInit;
    status?: number;
    forceDynamic?: boolean;
};

interface Response<DATA> {
    headers: Headers;
    status: http.Status | undefined;
    data: DATA;
    dataHash: string;
}

class BaseResponse {
    #headers: Headers;
    #init: ResponseInit;

    constructor(init: ResponseInit = {}) {
        this.#init = init;
        this.#headers = new Headers(this.#init.headers);
        if (this.#init?.forceDynamic) {
            http.setCookie(this.#headers, {
                httpOnly: true,
                name: FORCE_GENERATE_COOKIE,
                value: "true",
            });
        }
    }

    get headers() {
        return this.#headers;
    }

    get status(): http.Status | undefined {
        return this.#init.status;
    }
}

export class EmptyResponse extends BaseResponse implements Response<void> {
    type: "empty";

    constructor(init?: ResponseInit) {
        super(init);
        this.type = "empty";
    }

    get data(): void {
        return undefined;
    }

    get dataHash() {
        return "__void__";
    }
}

export class DataResponse<DATA extends JSONValue> extends BaseResponse implements Response<DATA> {
    #data: DATA;
    type: "data";

    constructor(data: DATA, init?: ResponseInit) {
        super(init);
        this.#data = data;
        this.type = "data";
    }

    get data() {
        return this.#data;
    }

    get dataHash() {
        return JSON.stringify(hashableJsonValue(this.data)) ?? "";
    }
}
