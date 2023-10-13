import * as http from "../../../../dependencies/http.js";

import { FrugalConfig } from "../../../Config.js";
import { Session } from "../../session/Session.js";
import { xor } from "./xor.js";

const CSRF_TOKEN_COOKIE_NAME = "csrftoken";

export class CsrfToken {
    /** @type {Session} */
    #session;
    /** @type {FrugalConfig} */
    #config;
    /** @type {string} */
    #token;
    /** @type {string} */
    #mask;

    /**
     * @param {Session} session
     * @param {FrugalConfig} config
     */
    constructor(session, config) {
        this.#session = session;
        this.#config = config;
        this.#token = this.#generateToken();
        this.#mask = crypto.randomUUID();
    }

    /** @param {Response} response */
    attach(response) {
        http.setCookie(response.headers, {
            name: this.#config.server?.csrf?.cookieName ?? CSRF_TOKEN_COOKIE_NAME,
            value: this.#token,
            httpOnly: false,
            sameSite: "lax",
            path: "/",
        });
    }

    get value() {
        return this.#token;
    }

    get maskedValue() {
        return `${this.#mask}:${xor(this.#token, this.#mask)}`;
    }

    /** @returns {string} */
    #generateToken() {
        const token = crypto.randomUUID();
        this.#session.set("__frugal_csrftoken", token);
        return token;
    }
}
