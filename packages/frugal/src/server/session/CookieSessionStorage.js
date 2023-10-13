import * as http from "../../../dependencies/http.js";

import * as cookieConfig from "./CookieConfig.js";
import * as sessionStorage from "./SessionStorage.js";

/** @implements {sessionStorage.SessionStorage} */
export class CookieSessionStorage {
    /** @type {cookieConfig.CookieConfig} */
    #cookie;

    /** @param {cookieConfig.CookieConfig} cookie */
    constructor(cookie) {
        this.#cookie = cookie;
    }

    /**
     * @param {Headers} headers
     * @param {sessionStorage.SessionData} data
     * @param {number | undefined} expires
     * @returns {string}
     */
    create(headers, data, expires) {
        const id = `__frugal_session_${crypto.randomUUID()}`;

        http.setCookie(headers, {
            name: id,
            ...this.#cookie,
            value: JSON.stringify(data),
            expires,
        });

        return id;
    }

    /**
     * @param {Headers} headers
     * @param {string} id
     * @returns {sessionStorage.SessionData}
     */
    get(headers, id) {
        const cookies = http.getCookies(headers);
        const serializedData = cookies[id];
        return JSON.parse(serializedData);
    }

    /**
     * @param {Headers} headers
     * @param {string} id
     * @param {sessionStorage.SessionData} data
     * @param {number} [expires]
     */
    update(headers, id, data, expires) {
        http.setCookie(headers, {
            name: id,
            ...this.#cookie,
            value: JSON.stringify(data),
            expires,
        });
    }

    /**
     * @param {Headers} headers
     * @param {string} id
     */
    delete(headers, id) {
        http.setCookie(headers, {
            name: id,
            ...this.#cookie,
            value: "",
            expires: new Date(0),
            maxAge: 0,
        });
    }
}
