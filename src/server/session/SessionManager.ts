import * as http from "../../../dep/std/http.ts";
import { CookieConfig } from "./CookieConfig.ts";
import { Session } from "./Session.ts";
import { SessionStorage } from "./SessionStorage.ts";

const DEFAULT_SESSION_COOKIE_NAME = "__frugal_session";

export type SessionManagerConfig = {
    storage: SessionStorage;
    cookie?: CookieConfig;
};

export class SessionManager {
    #storage: SessionStorage;
    #cookie: CookieConfig;

    constructor(config: SessionManagerConfig) {
        this.#storage = config.storage;
        this.#cookie = config.cookie ?? {};
    }

    async get(headers: Headers): Promise<Session> {
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

    async persist(session: Session, headers: Headers): Promise<void> {
        if (!session._shouldBePersisted) {
            return;
        }

        const expires = this.#cookie.expires !== undefined ? Number(this.#cookie.expires) : undefined;

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

    async destroy(session: Session, headers: Headers): Promise<void> {
        if (session._id !== undefined) {
            await this.#storage.delete(headers, session._id);
        }

        http.setCookie(headers, {
            name: DEFAULT_SESSION_COOKIE_NAME,
            ...this.#cookie,
            value: "",
            expires: new Date(0),
        });
    }
}
