import * as http from '../../dep/std/http.ts';

import * as frugal from '../core/mod.ts';

export type Config = frugal.Config & { server: ServerConfig };

type StatusMapping = Partial<
    Record<
        http.Status,
        (
            url: URL,
        ) =>
            & { url: string | URL }
            & ({ type: 'redirect'; status: http.Status } | { type: 'rewrite' })
    >
>;

export type ServerConfig = {
    refreshKey?: string;
    sessionPersistence?: frugal.Persistence;
    listen: http.ServeInit;
    statusMapping?: StatusMapping;
    session: SessionConfig;
    csrf?: CsrfConfig;
};

export type SessionConfig = {
    key: CryptoKey;
    cookieName?: string;
};

export type CsrfConfig = {
    isUrlProtected: (url: URL) => boolean;
    csrfTokenCookieName?: string;
    csrfHeaderName?: string;
    csrfFieldName?: string;
};

const FS_PERSISTANCE = new frugal.FilesystemPersistence();

export class CleanConfig {
    #config: ServerConfig;

    constructor(config: ServerConfig) {
        this.#config = config;
    }

    get refreshKey() {
        return this.#config.refreshKey;
    }

    get sessionPersistence() {
        return this.#config.sessionPersistence ?? FS_PERSISTANCE;
    }

    get listen() {
        return this.#config.listen;
    }

    get statusMapping(): StatusMapping {
        return this.#config.statusMapping ?? {};
    }

    get session() {
        return this.#config.session;
    }

    get csrf() {
        return this.#config.csrf;
    }
}
