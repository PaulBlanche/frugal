import * as http from "../../dep/std/http.ts";
import { hashableJsonValue, type JSONValue } from "./JSONValue.ts";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

type DataResponseInit<DATA> = {
    headers?: HeadersInit;
    status?: number;
    forceDynamic?: boolean;
} & (DATA extends void ? { data?: DATA } : { data: DATA });

export class DataResponse<DATA extends JSONValue | void> {
    #headers: Headers;
    #init: DataResponseInit<DATA>;
    #type: "data" | "empty";

    constructor(init: DataResponseInit<DATA>) {
        this.#init = init;
        this.#type = "data" in init ? "data" : "empty";
        this.#headers = new Headers(this.#init.headers);
        if (this.#init?.forceDynamic) {
            http.setCookie(this.#headers, {
                httpOnly: true,
                name: FORCE_GENERATE_COOKIE,
                value: "true",
            });
        }
    }

    get type() {
        return this.#type;
    }

    get data() {
        return this.#init.data as DATA;
    }

    get dataHash() {
        if (this.data === undefined) {
            return "";
        }
        return JSON.stringify(hashableJsonValue(this.data)) ?? "";
    }

    get headers() {
        return this.#headers;
    }

    get status(): http.Status | undefined {
        return this.#init.status;
    }
}
