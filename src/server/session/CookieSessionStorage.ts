import * as http from "../../../dep/std/http.ts";

import { CookieConfig } from "./CookieConfig.ts";
import { SessionData, SessionStorage } from "./SessionStorage.ts";

export class CookieSessionStorage implements SessionStorage {
    #cookie: CookieConfig;

    constructor(cookie: CookieConfig) {
        this.#cookie = cookie;
    }

    create(headers: Headers, data: SessionData, expires: number | undefined) {
        const id = `__frugal_session_${crypto.randomUUID()}`;

        http.setCookie(headers, {
            name: id,
            ...this.#cookie,
            value: JSON.stringify(data),
            expires,
        });

        return id;
    }

    get(headers: Headers, id: string) {
        const cookies = http.getCookies(headers);
        const serializedData = cookies[id];
        return JSON.parse(serializedData) as SessionData;
    }

    update(
        headers: Headers,
        id: string,
        data: SessionData,
        expires?: number | undefined,
    ) {
        http.setCookie(headers, {
            name: id,
            ...this.#cookie,
            value: JSON.stringify(data),
            expires,
        });
    }

    delete(headers: Headers, id: string) {
        http.setCookie(headers, {
            name: id,
            ...this.#cookie,
            value: "",
            expires: new Date(0),
            maxAge: 0,
        });
    }
}
