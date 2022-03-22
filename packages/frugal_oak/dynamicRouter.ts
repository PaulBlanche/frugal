import { Router } from '../../dep/oak.ts';
import { Frugal } from '../core/mod.ts';

export function getDynamicRouter(frugal: Frugal): Router {
    const router = new Router();

    for (const route of frugal.generateRoutes) {
        router.get(route, async (context) => {
            const url = context.request.url;
            const result = await frugal.generate(
                url.pathname,
                url.searchParams,
            );
            if (result === undefined) {
                context.response.status = 404;
                context.response.body = 'Not found';
                return;
            }

            context.response.status = 200;
            context.response.body = result.content;
        });
    }

    return router;
}
