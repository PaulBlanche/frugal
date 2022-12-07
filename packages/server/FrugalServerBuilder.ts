import * as frugal from '../core/mod.ts';
import * as log from '../log/mod.ts';

import { FrugalServer } from './FrugalServer.ts';
import { CleanConfig, Config } from './Config.ts';

const LOGGERS = [
    ...frugal.LOGGERS,
    'frugal_server:FrugalServer',
    'frugal_server:etagMiddleware',
    'frugal_server:filesystemMiddleware',
    'frugal_server:pageRouterMiddleware',
    'frugal_server:statusRewriteMiddleware',
    'frugal_server:generateMiddleware',
    'frugal_server:dynamicPageMiddleware',
    'frugal_server:postRedirectGet:getMiddleware',
    'frugal_server:cacheMiddleware',
    'frugal_server:forceRefreshMiddleware',
    'frugal_server:staticPageMiddleware',
    'frugal_server:refreshJitMiddleware',
];

export function loggers(level: log.Config['loggers'][string]) {
    return LOGGERS.reduce<log.Config['loggers']>((loggers, logger) => {
        loggers[logger] = level;
        return loggers;
    }, {});
}

export const OFF_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: loggers('NOTSET'),
};

export const DEFAULT_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: loggers('INFO'),
};

export const DEBUG_LOGGER_CONFIG: log.Config = {
    type: 'human',
    loggers: loggers('DEBUG'),
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
        server,
        ...frugalConfig
    }: Config) {
        this.#config = new CleanConfig(server);

        this.#builder = new frugal.FrugalBuilder({
            ...frugalConfig,
            logging: {
                type: frugalConfig.logging?.type,
                loggers: {
                    ...DEFAULT_LOGGER_CONFIG.loggers,
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
