import { composeMiddleware, Middleware } from '../../dep/oak.ts';
import { StaticRouter } from './StaticRouter.ts';
import { FilesystemPersistance, Frugal, Persistance } from '../core/mod.ts';
import { DynamicRouter } from './DynamicRouter.ts';
import { staticFileMiddleware } from './staticFileMiddleware.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';
import { SessionManager } from './SessionManager.ts';
import { trailingSlashMiddleware } from './trailingSlashMiddleware.ts';
import * as log from '../log/mod.ts';

const fsPersistance = new FilesystemPersistance();

type Config = {
    refreshKey?: string;
    sessionPersistance?: Persistance;
    loggers?: log.Config['loggers'];
};

const DEFAULT_LOGGER: Config['loggers'] = {
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

export async function frugalMiddleware(
    frugal: Frugal,
    { refreshKey, sessionPersistance = fsPersistance, loggers = {} }: Config =
        {},
): Promise<Middleware> {
    const sessionManager = new SessionManager(sessionPersistance, frugal);
    const prgOrchestrator = new PrgOrchestrator(frugal, sessionManager);
    const staticRouter = new StaticRouter(
        frugal,
        prgOrchestrator,
        refreshKey,
    );
    const dynamicRouter = new DynamicRouter(frugal, prgOrchestrator);

    await log.setup({
        type: frugal.config.loggingConfig.type,
        loggers: {
            ...frugal.config.loggingConfig.loggers,
            ...DEFAULT_LOGGER,
            ...loggers,
        },
    });

    return composeMiddleware([
        trailingSlashMiddleware(),
        dynamicRouter.routes(),
        staticRouter.routes(),
        staticFileMiddleware({
            frugal,
        }),
        dynamicRouter.allowedMethods(),
        staticRouter.allowedMethods(),
    ]);
}
