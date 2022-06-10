import * as frugal from '../core/mod.ts';
import * as oak from 'oak';
import { StaticRouter } from './StaticRouter.ts';
import { DynamicRouter } from './DynamicRouter.ts';
import { staticFileMiddleware } from './staticFileMiddleware.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';
import { SessionManager } from './SessionManager.ts';
import { trailingSlashMiddleware } from './trailingSlashMiddleware.ts';
import * as log from '../log/mod.ts';

const fsPersistance = new frugal.FilesystemPersistance();

type CleanServerConfig = {
    refreshKey?: string;
    sessionPersistance: frugal.Persistance;
    listen: oak.ListenOptions;
};

type ServerConfig = {
    refreshKey?: string;
    sessionPersistance?: frugal.Persistance;
    listen: oak.ListenOptions;
};

export type Config = frugal.Config & ServerConfig;

const DEFAULT_LOGGER_CONFIG: log.Config['loggers'] = {
    'frugal_oak:DynamicRouter': 'INFO',
    'frugal_oak:DynamicRouter:generateMiddleware': 'INFO',
    'frugal_oak:PrgOrchestrator': 'INFO',
    'frugal_oak:PrgOrchestrator:postMiddleware': 'INFO',
    'frugal_oak:PrgOrchestrator:getRedirectionMiddleware': 'INFO',
    'frugal_oak:staticFileMiddleware': 'INFO',
    'frugal_oak:staticFileMiddleware:filesystemMiddleware': 'INFO',
    'frugal_oak:staticFileMiddleware:autoIndexMiddleware': 'INFO',
    'frugal_oak:StaticRouter': 'INFO',
    'frugal_oak:StaticRouter:forceRefreshMiddleware': 'INFO',
    'frugal_oak:StaticRouter:cachedMiddleware': 'INFO',
    'frugal_oak:StaticRouter:refreshJitMiddleware': 'INFO',
};

export class FrugalServerInstance {
    #application: oak.Application;
    #config: CleanServerConfig;
    #frugal: frugal.FrugalInstance;

    constructor(config: CleanServerConfig, frugal: frugal.FrugalInstance) {
        this.#application = new oak.Application();
        this.#config = config;
        this.#frugal = frugal;

        this.#application.use(this.middleware());
    }

    get application() {
        return this.#application;
    }

    middleware() {
        const sessionManager = new SessionManager(
            this.#config.sessionPersistance,
            this.#frugal,
        );

        const prgOrchestrator = new PrgOrchestrator(
            this.#frugal,
            sessionManager,
        );

        const staticRouter = new StaticRouter(
            this.#frugal,
            prgOrchestrator,
            this.#config.refreshKey,
        );

        const dynamicRouter = new DynamicRouter(
            this.#frugal,
            prgOrchestrator,
        );

        return oak.composeMiddleware([
            trailingSlashMiddleware(),
            dynamicRouter.routes(),
            staticRouter.routes(),
            staticFileMiddleware({ frugal: this.#frugal }),
            dynamicRouter.allowedMethods(),
            staticRouter.allowedMethods(),
        ]);
    }

    async listen() {
        this.#application.addEventListener(
            'listen',
            ({ hostname, port, secure }) => {
                console.log(
                    `Listening on: ${secure ? 'https://' : 'http://'}${
                        hostname ?? 'localhost'
                    }:${port}`,
                );
            },
        );

        await this.#application.listen(this.#config.listen);
    }
}

export class FrugalServerBuilder {
    #config: CleanServerConfig;
    #builder: frugal.FrugalBuilder;

    constructor({
        refreshKey,
        sessionPersistance = fsPersistance,
        listen,
        ...frugalConfig
    }: Config) {
        this.#config = {
            refreshKey,
            sessionPersistance,
            listen,
        };

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
        return new FrugalServerInstance(this.#config, instance);
    }

    async load() {
        const instance = await this.#builder.load();
        return new FrugalServerInstance(this.#config, instance);
    }
}

export async function serve(config: Config) {
    const builder = new FrugalServerBuilder(config);
    const instance = await builder.load();
    await instance.listen();
}
