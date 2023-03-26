import * as djwt from '../../dep/djwt.ts';
import * as http from '../../dep/std/http.ts';
import * as zod from '../../dep/zod.ts';

import { Config } from '../Config.ts';
import { Log } from '../log.ts';
import { Persistence } from '../persistence/Persistence.ts';

const SESSION_TOKEN_COOKIE_NAME = 'frugal_session_token';

const sessionPayloadSchema = zod.intersection(
    zod.object({
        jti: zod.string(),
    }),
    zod.record(zod.optional(zod.union([
        zod.string(),
        zod.number(),
        zod.boolean(),
    ]))),
);

type SessionPayload = zod.infer<typeof sessionPayloadSchema>;

type TokenPayload = djwt.Payload & { jti: string; iat: number; exp: number };

type SessionConfig = {
    cookieName: string;
    config: Config;
    persistence: Persistence;
    log: Log;
};

export class Session {
    #payload: SessionPayload;
    #key: CryptoKey;
    #cookieName: string;
    #shouldAttach: boolean;
    #tokenStore: TokenStore;
    #persistenceStore: PersistenceStore;
    #config: Config;
    #log: Log;

    static async restore(
        headers: Headers,
        config: Config,
        log: Log,
    ): Promise<Session | undefined> {
        if (config.server.session === undefined) {
            log(`no session config, sessions are disabled`, {
                kind: 'debug',
                scope: 'Session',
            });
            return undefined;
        }

        const cookieName = config.server.session.cookieName ??
            SESSION_TOKEN_COOKIE_NAME;
        const key = config.server.session.key;
        const persistence = config.server.session.persistence;

        const sessionConfig = { cookieName, config, log, persistence };

        const cookies = http.getCookies(headers);
        const sessionToken = cookies[cookieName];

        // no session cookie found, create a new one
        if (sessionToken === undefined) {
            log(`no session cookie found, fallbak on clean session`, {
                kind: 'debug',
                scope: 'Session',
            });
            return new Session(key, undefined, sessionConfig);
        }

        try {
            const payload = await djwt.verify(sessionToken, key);

            // no expiration or expired jwt, create a new one
            if (!payload.exp || payload.exp < djwt.getNumericDate(0)) {
                log(`expired jwt, fallback on clean session`, {
                    kind: 'debug',
                    scope: 'Session',
                });
                return new Session(key, undefined, sessionConfig);
            }

            const parseResult = sessionPayloadSchema.safeParse(payload);
            // payload not matching schema, create a new one
            if (!parseResult.success) {
                log(`invalid payload, fallback on clean session`, {
                    kind: 'debug',
                    scope: 'Session',
                });
                return new Session(key, undefined, sessionConfig);
            }

            log(`restore session ${parseResult.data.jti}`, {
                kind: 'debug',
                scope: 'Session',
            });

            // create the session from the payload
            return new Session(key, parseResult.data, sessionConfig);
        } catch { // error while validating session jwt, create a new one
            log(`Error while restoring, fallback on clean session`, {
                kind: 'debug',
                scope: 'Session',
            });
            return new Session(key, undefined, sessionConfig);
        }
    }

    constructor(
        key: CryptoKey,
        payload: SessionPayload | undefined,
        { cookieName, config, log, persistence }: SessionConfig,
    ) {
        this.#key = key;
        this.#payload = payload ?? {
            jti: crypto.randomUUID(),
        };
        this.#cookieName = cookieName;
        this.#shouldAttach = false;
        this.#tokenStore = new TokenStore(this.#payload);
        this.#persistenceStore = new PersistenceStore(
            persistence,
            this.#payload.jti,
        );
        this.#config = config;
        this.#log = log;
    }

    shouldAttach() {
        this.#shouldAttach = true;
    }

    get secret() {
        return this.#payload.jti;
    }

    store(type: 'token'): TokenStore;
    store(type: 'persistence'): PersistenceStore;
    store(type: 'token' | 'persistence') {
        return type === 'token' ? this.#tokenStore : this.#persistenceStore;
    }

    #tokenPayload(): TokenPayload {
        return {
            iat: djwt.getNumericDate(0), // now (default value, keep the one in payload)
            ...this.#payload,
            exp: djwt.getNumericDate(60),
            //exp: djwt.getNumericDate(60 * 60), // now + 1 hour (override the one in payload to refresh the token)
        };
    }

    async #token(tokenPayload: TokenPayload): Promise<string> {
        return await djwt.create({ alg: 'HS512' }, tokenPayload, this.#key);
    }

    async attach(headers: Headers) {
        if (this.#shouldAttach) {
            const cookies = http.getSetCookies(headers);
            const hasSessionCookie = cookies.some((cookie) =>
                cookie.name === this.#cookieName
            );
            if (!hasSessionCookie) {
                this.#log(`attach session ${this.#payload.jti}`, {
                    kind: 'debug',
                    scope: 'Session',
                });

                const tokenPayload = this.#tokenPayload();

                this.#config.server.session?.onAttach?.(
                    tokenPayload.jti,
                    tokenPayload.exp,
                );

                http.setCookie(headers, {
                    name: this.#cookieName,
                    value: await this.#token(tokenPayload),
                    httpOnly: true,
                    sameSite: 'Lax',
                    path: '/',
                });
            }
        }
    }
}

const RESERVED_KEYS = ['jti', 'flash'];

class TokenStore {
    #payload: SessionPayload;

    constructor(payload: SessionPayload) {
        this.#payload = payload;
    }

    set(key: string, value: string | number | boolean) {
        if (RESERVED_KEYS.includes(key)) {
            return;
        }
        this.#payload[key] = value;
    }

    get(key: string) {
        if (RESERVED_KEYS.includes(key)) {
            return;
        }
        return this.#payload[key];
    }

    unset(key: string) {
        if (RESERVED_KEYS.includes(key)) {
            return;
        }
        return delete this.#payload[key];
    }

    has(key: string) {
        if (RESERVED_KEYS.includes(key)) {
            return false;
        }
        return key in this.#payload;
    }
}

class PersistenceStore {
    #persistence: Persistence;
    #id: string;

    constructor(persistence: Persistence, id: string) {
        this.#persistence = persistence;
        this.#id = id;
    }

    async set(key: string, content: string) {
        await this.#persistence.set([this.#id, key], content);
    }

    async get(key: string) {
        return await this.#persistence.get([this.#id, key]);
    }

    async delete(key: string) {
        await this.#persistence.delete([this.#id, key]);
    }
}
