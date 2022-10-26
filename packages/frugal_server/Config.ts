import * as http from '../../dep/std/http.ts';

import * as frugal from '../core/mod.ts';

export type Config = frugal.Config & { server: ServerConfig };

export type ServerConfig = {
    refreshKey?: string;
    sessionPersistance?: frugal.Persistance;
    listen: http.ServeInit;
    statusRewrite?: Partial<
        Record<http.Status | 'error', (url: URL) => string>
    >;
};

const FS_PERSISTANCE = new frugal.FilesystemPersistance();

export class CleanConfig {
    #config: ServerConfig;

    constructor(config: ServerConfig) {
        this.#config = config;
    }

    get refreshKey() {
        return this.#config.refreshKey;
    }

    get sessionPersistance() {
        return this.#config.sessionPersistance ?? FS_PERSISTANCE;
    }

    get listen() {
        return this.#config.listen;
    }

    get statusRewrite(): Partial<
        Record<number | 'error', (url: URL) => string>
    > {
        return this.#config.statusRewrite ?? {};
    }
}
