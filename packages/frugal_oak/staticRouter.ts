import { HttpError, Router } from '../../dep/oak.ts';
import { Frugal } from '../core/mod.ts';

export function getStaticRouter(frugal: Frugal): Router {
    const router = new Router();

    for (const route of frugal.refreshRoutes) {
        router.get(route, async (context) => {
            const pagePath = context.request.url.pathname;
            try {
                await context.send({
                    path: pagePath,
                    root: frugal.config.publicDir,
                    index: 'index.html',
                });
            } catch (error: any) {
                if (error instanceof HttpError && error.status === 404) {
                    const success = await frugal.refresh(pagePath);

                    if (success === undefined) {
                        throw error;
                    }

                    return await context.send({
                        root: frugal.config.publicDir,
                        path: pagePath,
                    });
                }
                throw error;
            }
        });
    }

    return router;
}
