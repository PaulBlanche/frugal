import { Router } from '../../dep/oak.ts';
import { Frugal } from '../core/mod.ts';

export function refreshRouter(frugal: Frugal): Router {
    const router = new Router();

    router.get('/refresh', async (context) => {
        const pathname = context.request.url.searchParams.get('pathname');

        if (pathname === null) {
            context.response.status = 400;
            context.response.body = 'No pathname';
            return;
        }

        const success = await frugal.refresh(pathname);

        if (!success) {
            context.response.status = 422;
            context.response.body = 'No page matching pathname found';
            return;
        }

        context.response.status = 201;
        context.response.body = 'Page regenerated';
    });

    return router;
}
