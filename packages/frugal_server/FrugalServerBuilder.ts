import * as frugal from '../core/mod.ts';
import * as log from '../log/mod.ts';

import { FrugalServer } from './FrugalServer.ts';
import { CleanConfig, Config } from './Config.ts';

const DEFAULT_LOGGER_CONFIG: log.Config['loggers'] = {
    'frugal_server:generateMiddleware': 'INFO',
    'frugal_server:dynamicPageMiddleware': 'INFO',
    'frugal_server:postRedirectGet:getMiddleware': 'INFO',
    'frugal_server:postRedirectGet:postRedirectMiddleware': 'INFO',
    'frugal_server:cacheMiddleware': 'INFO',
    'frugal_server:forceRefreshMiddleware': 'INFO',
    'frugal_server:refreshJitMiddleware': 'INFO',
    'frugal_server:etagMiddleware': 'INFO',
    'frugal_server:filesystemMiddleware': 'INFO',
    'frugal_server:pageRouterMiddleware': 'INFO',
    'frugal_server:FrugalServer': 'INFO',
};

export async function serve(config: Config) {
    const builder = new FrugalServerBuilder(config);
    const instance = await builder.load();
    await instance.listen();
}

export class FrugalServerBuilder {
    #config: CleanConfig;
    #builder: frugal.FrugalBuilder;

    constructor({
        refreshKey,
        sessionPersistance,
        listen,
        ...frugalConfig
    }: Config) {
        this.#config = new CleanConfig({
            refreshKey,
            sessionPersistance,
            listen,
        });

        this.#builder = new frugal.FrugalBuilder({
            ...frugalConfig,
            logging: {
                type: frugalConfig.logging?.type,
                loggers: {
                    ...DEFAULT_LOGGER_CONFIG,
                    ...frugalConfig.logging?.loggers,
                },
            },
        });
    }

    get _watch() {
        return this.#builder._watch;
    }

    set _watch(watch: boolean | undefined) {
        this.#builder._watch = watch;
    }

    _getCleanConfig() {
        return this.#builder._getCleanConfig();
    }

    async create() {
        const instance = await this.#builder.create();
        return new FrugalServer(this.#config, instance);
    }

    async load() {
        const instance = await this.#builder.load();
        return new FrugalServer(this.#config, instance);
    }
}
