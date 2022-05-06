import { composeMiddleware, Context, etag, Router } from 'oak';
import { Frugal, NotFound } from '../core/mod.ts';
import { StaticContext } from './FrugalContext.ts';
import * as path from '../../dep/std/path.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';
import * as log from '../log/mod.ts';

function logger(middleware?: string) {
    if (middleware === undefined) {
        return log.getLogger('frugal_oak:StaticRouter');
    }
    return log.getLogger(`frugal_oak:StaticRouter:${middleware}`);
}

export class StaticRouter {
    router: Router;
    frugal: Frugal;
    prgOrchestrator: PrgOrchestrator;
    refreshKey?: string;

    constructor(
        frugal: Frugal,
        prgOrchestrator: PrgOrchestrator,
        refreshKey?: string,
    ) {
        this.router = new Router();
        this.frugal = frugal;
        this.prgOrchestrator = prgOrchestrator;
        this.refreshKey = refreshKey;

        this._register(this.router);
    }

    routes() {
        return this.router.routes();
    }

    allowedMethods() {
        return this.router.allowedMethods();
    }

    private _register(router: Router) {
        if (this.frugal.config.devMode) {
            return;
        }

        const prgRedirectionMiddleware = this.prgOrchestrator.getRedirection();
        const prgPostMiddleware = this.prgOrchestrator.post();
        const forceRefreshMiddleware = this._forceRefreshMiddleware();
        const cachedMiddleware = this._cachedMiddleware();
        const refreshJitMiddleware = this._refreshJitMiddleware();

        const getMiddleware = composeMiddleware(
            [
                // handle force refresh first if needed (usually webhook,
                // outside of "user flow")
                forceRefreshMiddleware,
                // start of "user flow", first try PRG if needed
                prgRedirectionMiddleware,
                // then try to serve cached page
                cachedMiddleware,
                // then try to refresh to populate cache, and serve cached page
                refreshJitMiddleware,
            ],
        );

        const postMiddleware = composeMiddleware([
            prgPostMiddleware,
        ]);

        for (const pattern in this.frugal.routes) {
            const route = this.frugal.routes[pattern];
            if (route.type === 'dynamic') {
                continue;
            }

            logger().debug({
                canPostDynamicData: route.page.canPostDynamicData,
                pattern: route.page.pattern,
                msg() {
                    return `registering route ${this.pattern}`;
                },
            });

            router.get(route.page.pattern, async (context, next) => {
                const ctx = context as StaticContext;
                ctx.generator = route.generator;
                ctx.builder = route.builder;
                ctx.refresher = route.refresher;
                return await getMiddleware(context, next);
            });

            if (route.page.canPostDynamicData) {
                router.post(route.page.pattern, async (context, next) => {
                    const ctx = context as StaticContext;
                    ctx.generator = route.generator;
                    ctx.builder = route.builder;
                    ctx.refresher = route.refresher;
                    return await postMiddleware(context, next);
                });
            }
        }
    }

    private _forceRefreshMiddleware() {
        return async (context: Context, next: () => Promise<unknown>) => {
            if (this.refreshKey === undefined) {
                logger('forceRefreshMiddleware').debug({
                    msg() {
                        return `no refresh key, skip middleware`;
                    },
                });

                return await next();
            }

            const ctx = context as StaticContext;
            assert(ctx.refresher);

            const url = context.request.url;

            logger('forceRefreshMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `handle ${this.method} ${this.pathname}`;
                },
            });

            if (!url.searchParams.has('force_refresh')) {
                logger('forceRefreshMiddleware').debug({
                    method: context.request.method,
                    pathname: url.pathname,
                    msg() {
                        return `no refresh key in request for ${this.method} ${this.pathname}, skip middleware`;
                    },
                });
                return await next();
            }

            const authorization = context.request.headers.get('Authorization');
            const match = authorization?.match(/Bearer (.*)/);
            if (
                match === null || match === undefined ||
                match[1] !== this.refreshKey
            ) {
                logger('forceRefreshMiddleware').debug({
                    method: context.request.method,
                    pathname: url.pathname,
                    msg() {
                        return `refresh key not matching, handle failure for ${this.method} ${this.pathname}`;
                    },
                });
                context.response.status = 401;
                return;
            }

            await ctx.refresher.refresh(url.pathname);

            logger('forceRefreshMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `handle successful for ${this.method} ${this.pathname}, refresh done, delegate to next middleware`;
                },
            });

            return await next();
        };
    }

    private _cachedMiddleware() {
        return async (context: Context, next: () => Promise<unknown>) => {
            const url = context.request.url;

            logger('cachedMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `handle ${this.method} ${this.pathname}`;
                },
            });

            try {
                if (url.pathname.endsWith('.html')) {
                    const filename = url.pathname;
                    logger('cachedMiddleware').debug({
                        method: context.request.method,
                        pathname: url.pathname,
                        filename,
                        msg() {
                            return `try to respond to ${this.method} ${this.pathname} with ${this.filename}`;
                        },
                    });
                    await this._sendFromCache(context, filename);
                } else {
                    const filename = path.join(url.pathname, 'index.html');
                    logger('cachedMiddleware').debug({
                        method: context.request.method,
                        pathname: url.pathname,
                        filename,
                        msg() {
                            return `try to respond to ${this.method} ${this.pathname} with ${this.filename}`;
                        },
                    });
                    await this._sendFromCache(context, filename);
                }
            } catch (error: unknown) {
                if (error instanceof NotFound) {
                    logger('cachedMiddleware').debug({
                        method: context.request.method,
                        pathname: url.pathname,
                        msg() {
                            return `No cached response found for ${this.method} ${this.pathname}, delegate to next middleware`;
                        },
                    });

                    return await next();
                }
                throw error;
            }
        };
    }

    private _refreshJitMiddleware() {
        return async (context: Context, _next: () => Promise<unknown>) => {
            const ctx = context as StaticContext;
            assert(ctx.refresher);

            const url = context.request.url;

            logger('refreshJitMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `handle ${this.method} ${this.pathname}`;
                },
            });

            await ctx.refresher.refresh(url.pathname);

            return await this._sendFromCache(context, url.pathname);
        };
    }

    private async _sendFromCache(context: Context, pathname: string) {
        const config = this.frugal.config;

        const pagePath = path.join(config.publicDir, pathname);
        const content = await config.pagePersistance.get(pagePath);

        if (await ifNoneMatch(context, content)) {
            context.response.status = 200;
            context.response.body = content;
        } else {
            context.response.status = 304;
            context.response.body = null;
        }

        context.response.headers.set(
            'ETag',
            await etag.calculate(content, { weak: true }),
        );

        context.response.headers.set(
            'Cache-Control',
            'public, max-age=5, must-revalidate',
        );
    }
}

async function ifNoneMatch(context: Context, content: string) {
    const ifNoneMatchHeader = context.request.headers.get('If-None-Match');

    if (ifNoneMatchHeader) {
        return await etag.ifNoneMatch(
            context.request.headers.get('If-None-Match')!,
            content,
            { weak: true },
        );
    }

    return true;
}
