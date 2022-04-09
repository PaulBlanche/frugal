import { Router } from '../../dep/oak.ts';
import { Frugal, NotFound } from '../core/mod.ts';
import * as fs from '../../dep/std/fs.ts';
import * as path from '../../dep/std/path.ts';
import * as murmur from '../murmur/mod.ts';

export function getStaticRouter(frugal: Frugal): Router {
    const router = new Router();

    for (const route of frugal.refreshRoutes) {
        console.log('register static get', route);
        if (route.get) {
            router.get(route.pattern, async (context) => {
                const pagePath = context.request.url.pathname;
                try {
                    context.response.status = 200;
                    context.response.body = await frugal.config
                        .pagePersistance
                        .get(path.join(frugal.config.publicDir, pagePath));
                    return;
                } catch (error: any) {
                    if (error instanceof NotFound) {
                        const success = await frugal.refresh(pagePath);

                        if (success === undefined) {
                            throw error;
                        }

                        context.response.status = 200;
                        context.response.body = await frugal.config
                            .pagePersistance
                            .get(path.join(frugal.config.publicDir, pagePath));
                        return;
                    }
                    console.log(error);
                    throw error;
                }
            });
        }
    }

    for (const route of frugal.buildRoutes) {
        console.log('register static post', route);
        if (route.post) {
            router.post(route.pattern, async (context) => {
                const url = context.request.url;
                const result = await frugal.generate(url.pathname, {
                    method: 'POST',
                    searchParams: url.searchParams,
                    body: context.request.body(),
                });

                if (result === undefined) {
                    context.response.status = 404;
                    context.response.body = 'Not found';
                    return;
                }

                const nonce = crypto.randomUUID();
                const hash = new murmur.Hash().update(nonce).update(
                    result.content,
                ).alphabetic();

                await fs.ensureFile(
                    path.resolve(frugal.config.cacheDir, 'post', hash),
                );
                await Deno.writeTextFile(
                    path.resolve(frugal.config.cacheDir, 'post', hash),
                    result.content,
                );

                await context.cookies.set('hash', hash);
                context.response.status = 303;
                context.response.headers.set('Location', route.pattern);
            });
        }
    }

    return router;
}
