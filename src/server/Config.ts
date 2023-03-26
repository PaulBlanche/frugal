import { Config } from '../Config.ts';
import { FilesystemPersistence } from '../persistence/FilesystemPersistence.ts';
import { Persistence } from '../persistence/Persistence.ts';
import { Context } from './Context.ts';
import { Middleware } from './types.ts';

export type FrugalServerConfig = {
    port?: number;
    secure?: boolean;
    middlewares?: Middleware<Context>[];
    session?: {
        cookieName?: string;
        key: CryptoKey;
        persistence?: Persistence;
        onAttach?: (id: string, expire: number) => void;
    };
    csrf?: {
        cookieName?: string;
        fieldName?: string;
        headerName?: string;
        isProtected?: (url: URL) => boolean;
    };
    refreshKey?: string;
};

type SafeSession = {
    cookieName?: string;
    key: CryptoKey;
    persistence: Persistence;
    onAttach?: (id: string, expire: number) => void;
};

export class ServerConfig {
    #serverConfig: FrugalServerConfig;
    #config: Config;

    constructor(serverConfig: FrugalServerConfig, config: Config) {
        this.#serverConfig = serverConfig;
        this.#config = config;
    }

    get middlewares() {
        return this.#serverConfig.middlewares ?? [];
    }

    get port() {
        return this.#serverConfig.port ?? 8000;
    }

    get secure() {
        return this.#serverConfig.secure ?? false;
    }

    get session() {
        if (this.#serverConfig.session === undefined) {
            return undefined;
        }

        const session = {
            ...this.#serverConfig.session,
        } as SafeSession;

        if (session.persistence === undefined) {
            session.persistence = new FilesystemPersistence(
                new URL('runtime/session', this.#config.cachedir),
            );
        }

        return session;
    }

    get csrf() {
        return this.#serverConfig.csrf;
    }

    get refreshKey() {
        return this.#serverConfig.refreshKey;
    }
}
