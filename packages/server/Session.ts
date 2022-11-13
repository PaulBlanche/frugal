import * as djwt from '../../dep/djwt.ts';
import * as http from '../../dep/std/http.ts';
import * as zod from '../../dep/zod.ts';
import * as path from '../../dep/std/path.ts';

import * as murmur from '../murmur/mod.ts';
import * as core from '../core/mod.ts';

import { CleanConfig } from './Config.ts';

const SESSION_TOKEN_COOKIE_NAME = 'sessiontoken';

const sessionPayloadSchema = zod.intersection(
    zod.object({
        secret: zod.string(),
    }),
    zod.record(zod.optional(zod.union([
        zod.string(),
        zod.number(),
        zod.boolean(),
    ]))),
);

type SessionPayload = zod.infer<typeof sessionPayloadSchema>;

type SessionConfig = {
    cookieName: string;
    payload?: SessionPayload;
    persistence: core.Persistence;
    frugal: core.Frugal;
};

type SessionRestoreConfig = {
    config: CleanConfig;
    frugal: core.Frugal;
};

export class Session {
    #payload: SessionPayload;
    #key: CryptoKey;
    #cookieName: string;
    #persistence: core.Persistence;
    #frugal: core.Frugal;

    static async restore(
        request: Request,
        { config, frugal }: SessionRestoreConfig,
    ): Promise<Session> {
        const cookieName = config.session.cookieName ??
            SESSION_TOKEN_COOKIE_NAME;
        const key = config.session.key;
        const cookies = http.getCookies(request.headers);
        const sessionToken = cookies[cookieName];

        // no session cookie found, create a new one
        if (sessionToken === undefined) {
            return new Session(key, {
                cookieName,
                persistence: config.sessionPersistence,
                frugal: frugal,
            });
        }

        try {
            const payload = await djwt.verify(sessionToken, key);

            // no expiration or expired jwt, create a new one
            if (!payload.exp || payload.exp < djwt.getNumericDate(0)) {
                return new Session(key, {
                    cookieName,
                    persistence: config.sessionPersistence,
                    frugal: frugal,
                });
            }

            const parseResult = sessionPayloadSchema.safeParse(payload);
            // payload not matching schema, create a new one
            if (!parseResult.success) {
                return new Session(key, {
                    cookieName,
                    persistence: config.sessionPersistence,
                    frugal: frugal,
                });
            }

            return new Session(key, {
                cookieName,
                payload: parseResult.data,
                persistence: config.sessionPersistence,
                frugal: frugal,
            });
        } catch { // error while validating session jwt, create a new one
            return new Session(key, {
                cookieName,
                persistence: config.sessionPersistence,
                frugal: frugal,
            });
        }
    }

    constructor(key: CryptoKey, config: SessionConfig) {
        this.#key = key;
        this.#payload = config.payload ?? {
            secret: crypto.randomUUID(),
        };
        this.#cookieName = config.cookieName;
        this.#persistence = config.persistence;
        this.#frugal = config.frugal;
    }

    get secret() {
        return this.#payload.secret;
    }

    set(key: string, value: string | number | boolean) {
        this.#payload[key] = value;
    }

    get(key: string) {
        return this.#payload[key];
    }

    unset(key: string) {
        return delete this.#payload[key];
    }

    has(key: string) {
        return key in this.#payload;
    }

    async write(key: string, content: string) {
        await this.#persistence.set(this.#contentPath(key), content);
    }

    async read(key: string) {
        return await this.#persistence.read(this.#contentPath(key));
    }

    async delete(key: string) {
        return await this.#persistence.delete(this.#contentPath(key));
    }

    #contentPath(key: string) {
        const contentKey = new murmur.Hash()
            .update(this.#payload.secret)
            .update(key)
            .digest();

        return path.resolve(
            this.#frugal.config.cacheDir,
            'session',
            contentKey,
        );
    }

    async #token(): Promise<string> {
        return await djwt.create({ alg: 'HS512' }, {
            iat: djwt.getNumericDate(0), // now
            exp: djwt.getNumericDate(60 * 60), // now + 1 hour
            ...this.#payload,
        }, this.#key);
    }

    async attach(response: Response) {
        http.setCookie(response.headers, {
            name: this.#cookieName,
            value: await this.#token(),
            secure: true,
            httpOnly: true,
            sameSite: 'Lax',
            path: '/',
        });
    }
}

const KEY_FORMAT = 'jwk';
const KEY_ALGORITHM: HmacKeyGenParams = { name: 'HMAC', hash: 'SHA-512' };
const KEY_EXTRACTABLE = true;
const KEY_USAGE: KeyUsage[] = ['sign', 'verify'];

export async function importKey(key: string): Promise<CryptoKey> {
    const importkey = JSON.parse(atob(key));

    return await crypto.subtle.importKey(
        KEY_FORMAT,
        importkey,
        KEY_ALGORITHM,
        KEY_EXTRACTABLE,
        KEY_USAGE,
    );
}

export async function exportKey(): Promise<string> {
    const key = await crypto.subtle.generateKey(
        KEY_ALGORITHM,
        KEY_EXTRACTABLE,
        KEY_USAGE,
    );

    const exportKey = await crypto.subtle.exportKey(KEY_FORMAT, key);
    return btoa(JSON.stringify(exportKey));
}