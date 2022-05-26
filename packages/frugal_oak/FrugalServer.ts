import * as frugal from '../core/mod.ts';
import * as oak from 'oak';
import { StaticRouter } from './StaticRouter.ts';
import { DynamicRouter } from './DynamicRouter.ts';
import { staticFileMiddleware } from './staticFileMiddleware.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';
import { SessionManager } from './SessionManager.ts';
import { trailingSlashMiddleware } from './trailingSlashMiddleware.ts';
import * as log from '../log/mod.ts';
import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';

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

import { WatchChild } from '../core/watch/WatchChild.ts';

export class FrugalWatcherServer {
    #builder: FrugalServerBuilder;

    constructor(builder: FrugalServerBuilder) {
        this.#builder = builder;
        this.#builder._watch = true;
    }

    create() {
        return this.#builder.create();
    }

    async watch(paths: string[]) {
        const config = await this.#builder._getCleanConfig();
        const code =
            `const { config } = await import('file://${config.self.pathname}')
        const { WatchService } = await import('file://${
                new URL('../core/watch/WatchService.ts', import.meta.url)
                    .pathname
            }')
        const { FrugalWatcherServer, FrugalServerBuilder } = await import('file://${
                new URL('mod.ts', import.meta.url).pathname
            }')

        const service = new WatchService()

        const frugalServer = await new FrugalWatcherServer(new FrugalServerBuilder(config)).create();
        frugalServer.application.addEventListener('listen', () => {
            service.sendMessage({ type: 'restart' })
        })
        await frugalServer.listen();
        `;

        const filePath = path.join(config.cacheDir, 'watchServer.ts');

        await fs.ensureFile(filePath);
        await Deno.writeTextFile(filePath, code);

        const app = new oak.Application();
        const router = new oak.Router();

        const clients: oak.ServerSentEventTarget[] = [];

        router.get('/sse', (ctx) => {
            const target = ctx.sendEvents({
                headers: new Headers({
                    'Access-Control-Allow-Origin': '*',
                }),
            });
            const index = clients.length;
            clients.push(target);
            target.addEventListener('close', () => {
                console.log('livereload close');
                clients.splice(index, 1);
            });
        });

        app.use(router.routes(), router.allowedMethods());
        app.addEventListener('listen', () => {
            console.log('live reload server listening');
        });
        app.addEventListener('error', (error) => {
            console.log('SSE ERROR', error);
        });

        const child = new WatchChild(Deno.execPath(), {
            args: [
                'run',
                '--unstable',
                paths.length === 0 ? '--watch' : `--watch=${paths.join(',')}`,
                '--no-check',
                '--allow-all',
                filePath,
            ],
        });

        child.addEventListener('log', (event) => {
            console.log(...event.data);
        });

        child.addEventListener('message', (event) => {
            console.log('coucou');
            if (event.message.type === 'restart') {
                for (const client of clients) {
                    client.dispatchMessage({ type: 'reload' });
                }
            }
        });

        console.log('start watch');
        await Promise.all([app.listen({ port: 4075 }), child.start()]);

        /*
        const child = Deno.spawnChild(Deno.execPath(), {
            args: [
                'run',
                '--unstable',
                paths.length === 0 ? '--watch' : `--watch=${paths.join(',')}`,
                '--no-check',
                '--allow-all',
                filePath,
            ],
        });

        child.stdout.pipeTo(Deno.stdout.writable);
        child.stderr.pipeTo(Deno.stderr.writable);*/
    }
}
