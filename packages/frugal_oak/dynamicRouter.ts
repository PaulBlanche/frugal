import { HttpError, Router } from '../../dep/oak.ts';
import * as fs from '../../dep/std/fs.ts';
import * as path from '../../dep/std/path.ts';
import { Frugal } from '../core/mod.ts';
import * as murmur from '../murmur/mod.ts';

export function getDynamicRouter(frugal: Frugal): Router {
    const router = new Router();

    for (const route of frugal.generateRoutes) {
        console.log('register', route);

        if (route.get) {
            router.get(route.pattern, async (context) => {
                const hash = await context.cookies.get('hash');

                if (hash !== undefined) {
                    try {
                        console.log(
                            'try to read',
                            path.resolve(
                                '/post',
                                hash,
                            ),
                            frugal.config.cacheDir,
                        );
                        await context.send({
                            path: path.resolve(
                                '/post',
                                hash,
                            ),
                            root: frugal.config.cacheDir,
                        });

                        context.cookies.delete('hash');

                        await Deno.remove(
                            path.resolve(frugal.config.cacheDir, 'post', hash),
                        );

                        return;
                    } catch (error: unknown) {
                        if (
                            !(error instanceof HttpError &&
                                error.status === 404)
                        ) {
                            throw error;
                        }
                        console.log('404, generate');
                    }
                }

                const url = context.request.url;
                const result = await frugal.generate(url.pathname, {
                    method: 'GET',
                    searchParams: url.searchParams,
                });

                if (result === undefined) {
                    context.response.status = 404;
                    context.response.body = 'Not found';
                    return;
                }

                context.response.status = 200;
                context.response.body = result.content;
            });
        }

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
