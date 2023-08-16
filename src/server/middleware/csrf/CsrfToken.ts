import * as http from "../../../../dep/std/http.ts";

import { FrugalConfig } from "../../../Config.ts";
import { Session } from "../../session/mod.ts";
import { xor } from "./xor.ts";

const CSRF_TOKEN_COOKIE_NAME = "csrftoken";

export class CsrfToken {
    #session: Session;
    #config: FrugalConfig;
    #token: string;
    #mask: string;

    constructor(session: Session, config: FrugalConfig) {
        this.#session = session;
        this.#config = config;
        this.#token = this.#generateToken();
        this.#mask = crypto.randomUUID();
    }

    attach(response: Response) {
        http.setCookie(response.headers, {
            name: this.#config.server?.csrf?.cookieName ?? CSRF_TOKEN_COOKIE_NAME,
            value: this.#token,
            httpOnly: false,
            sameSite: "Lax",
            path: "/",
        });
    }

    get value() {
        return this.#token;
    }

    get maskedValue() {
        return `${this.#mask}:${xor(this.#token, this.#mask)}`;
    }

    #generateToken(): string {
        const token = crypto.randomUUID();
        this.#session.set("__frugal_csrftoken", token);
        return token;
    }
}
