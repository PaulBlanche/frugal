import * as _type from "./_type/Response.js";
export * from "./_type/Response.js";

import * as http from "../../dependencies/http.js";

import * as jsonValue from "./JSONValue.js";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

class BaseResponse {
    /** @type {Headers} */
    #headers;
    /** @type {_type.ResponseInit} */
    #init;

    /** @param {_type.ResponseInit} [init] */
    constructor(init = {}) {
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

    get status() {
        return this.#init.status;
    }
}

/** @implements {_type.Response<void>} */
export class EmptyResponse extends BaseResponse {
    /** @type {"empty"} */
    type = "empty";

    /** @param {_type.ResponseInit} [init] */
    constructor(init) {
        super(init);
    }

    /** @returns {void} */
    get data() {
        return undefined;
    }

    get dataHash() {
        return "__void__";
    }
}

/**
 * @template {jsonValue.JSONValue} DATA
 * @implements {_type.Response<DATA>}
 */
export class DataResponse extends BaseResponse {
    /** @type {DATA} */
    #data;
    /** @type {"data"} */
    type = "data";

    /**
     * @param {DATA} data
     * @param {ResponseInit} [init]
     */
    constructor(data, init) {
        super(init);
        this.#data = data;
    }

    get data() {
        return this.#data;
    }

    get dataHash() {
        return JSON.stringify(jsonValue.hashableJsonValue(this.data)) ?? "";
    }
}
