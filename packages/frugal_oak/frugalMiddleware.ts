import { composeMiddleware, Middleware } from '../../dep/oak.ts';
import { StaticRouter } from './StaticRouter.ts';
import { FilesystemPersistance, Frugal, Persistance } from '../core/mod.ts';
import { DynamicRouter } from './DynamicRouter.ts';
import { staticFileMiddleware } from './staticFileMiddleware.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';
import { SessionManager } from './SessionManager.ts';
import { trailingSlashMiddleware } from './trailingSlashMiddleware.ts';

const fsPersistance = new FilesystemPersistance();

type Config = {
    refreshKey?: string;
    sessionPersistance?: Persistance;
};

export function frugalMiddleware(
    frugal: Frugal,
    { refreshKey, sessionPersistance = fsPersistance }: Config = {},
): Middleware {
    const sessionManager = new SessionManager(sessionPersistance, frugal);
    const prgOrchestrator = new PrgOrchestrator(frugal, sessionManager);
    const staticRouter = new StaticRouter(
        frugal,
        prgOrchestrator,
        refreshKey,
    );
    const dynamicRouter = new DynamicRouter(frugal, prgOrchestrator);

    return composeMiddleware([
        trailingSlashMiddleware(),
        dynamicRouter.routes(),
        staticFileMiddleware({
            frugal,
        }),
        staticRouter.routes(),
        dynamicRouter.allowedMethods(),
        staticRouter.allowedMethods(),
    ]);
}
