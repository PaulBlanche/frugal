import { composeMiddleware, Context, Middleware } from 'oak';
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
        etags(),
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

import { etag } from 'oak';

function etags(): Middleware {
    const baseEtagMiddleware = etag.factory();
    return async (context, next) => {
        console.log('before etag', context.request.url.href);
        await baseEtagMiddleware(context, next);

        console.log(
            'after etag',
            context.request.url.href,
            context.response.headers.get('Etag'),
        );

        const ifNoneMatch = context.request.headers.get('If-None-Match');
        console.log('ifNoneMatch', context.request.url.href, ifNoneMatch);
        if (ifNoneMatch) {
            const entity = await etag.getEntity(context);
            if (entity && !etag.ifNoneMatch(ifNoneMatch, entity)) {
                console.log('304 for', context.request.url.href);
                context.response.status = 304;
                context.response.body = '';
            }
        }
    };
}
