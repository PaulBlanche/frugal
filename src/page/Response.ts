import * as http from "../../dep/std/http.ts";
import { hashableJsonValue, type JSONValue } from "./JSONValue.ts";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

export type PageResponse<DATA extends JSONValue> = EmptyResponse | DataResponse<DATA>;

type BaseResponseInit = {
    headers?: HeadersInit;
    status?: number;
    forceDynamic?: boolean;
};

class BaseResponse {
    #headers: Headers;
    #init: BaseResponseInit;

    constructor(init: BaseResponseInit) {
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

export class EmptyResponse extends BaseResponse {
    type: "empty";

    constructor(init: BaseResponseInit) {
        super(init);
        this.type = "empty";
    }

    get dataHash() {
        return "";
    }
}

type DataResponseInit<DATA extends JSONValue> = BaseResponseInit & {
    data: DATA;
};

export class DataResponse<DATA extends JSONValue> extends BaseResponse {
    #init: DataResponseInit<DATA>;
    type: "data";

    constructor(init: DataResponseInit<DATA>) {
        super(init);
        this.#init = init;
        this.type = "data";
    }

    get data() {
        return this.#init.data;
    }

    get dataHash() {
        return JSON.stringify(hashableJsonValue(this.data)) ?? "";
    }
}
