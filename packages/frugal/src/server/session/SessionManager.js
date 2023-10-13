import * as _type from "./_type/SessionManager.js";
export * from "./_type/SessionManager.js";

import * as http from "../../../dependencies/http.js";

import * as cookieConfig from "./CookieConfig.js";
import { Session } from "./Session.js";
import * as sessionStorage from "./SessionStorage.js";

const DEFAULT_SESSION_COOKIE_NAME = "__frugal_session";

export class SessionManager {
    /** @type {sessionStorage.SessionStorage} */
    #storage;
    /** @type {cookieConfig.CookieConfig} */
    #cookie;

    /** @param {_type.SessionManagerConfig} config */
    constructor(config) {
        this.#storage = config.storage;
        this.#cookie = config.cookie ?? {};
    }

    /**
     * @param {Headers} headers
     * @returns {Promise<Session>}
     */
    async get(headers) {
        const cookies = http.getCookies(headers);
        const id = cookies[this.#cookie.name ?? DEFAULT_SESSION_COOKIE_NAME];
        if (id !== undefined) {
            const data = await this.#storage.get(headers, id);
            if (data !== undefined) {
                return new Session(data, id);
            }
        }
        return new Session();
    }

    /**
     * @param {Session} session
     * @param {Headers} headers
     * @returns {Promise<void>}
     */
    async persist(session, headers) {
        if (!session._shouldBePersisted) {
            return;
        }

        const expires =
            this.#cookie.expires !== undefined ? Number(this.#cookie.expires) : undefined;

        let id = session._id;
        const data = session._data;

        if (id !== undefined) {
            await this.#storage.update(headers, id, data, expires);
        } else {
            id = await this.#storage.create(headers, data, expires);
        }

        http.setCookie(headers, {
            name: DEFAULT_SESSION_COOKIE_NAME,
            ...this.#cookie,
            value: id,
        });
    }

    /**
     * @param {Session} session
     * @param {Headers} headers
     */
    async destroy(session, headers) {
        if (session._id !== undefined) {
            await this.#storage.delete(headers, session._id);
        }

        http.setCookie(headers, {
            name: DEFAULT_SESSION_COOKIE_NAME,
            ...this.#cookie,
            value: "",
            expires: new Date(0),
            maxAge: 0,
        });
    }
}
