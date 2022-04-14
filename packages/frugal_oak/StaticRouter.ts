import { composeMiddleware, Context, Router } from '../../dep/oak.ts';
import { Frugal, NotFound } from '../core/mod.ts';
import { StaticContext } from './FrugalContext.ts';
import * as path from '../../dep/std/path.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';

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
                return await next();
            }

            const ctx = context as StaticContext;
            assert(ctx.refresher);

            const url = context.request.url;
            if (!url.searchParams.has('force_refresh')) {
                return await next();
            }

            const authorization = context.request.headers.get('Authorization');
            const match = authorization?.match(/Bearer (.*)/);
            if (
                match === null || match === undefined ||
                match[1] !== this.refreshKey
            ) {
                context.response.status = 401;
                return;
            }

            await ctx.refresher.refresh(url.pathname);
            return await next();
        };
    }

    private _cachedMiddleware() {
        return async (context: Context, next: () => Promise<unknown>) => {
            const url = context.request.url;
            try {
                return await this._sendFromCache(context, url.pathname);
            } catch (error: unknown) {
                if (error instanceof NotFound) {
                    return await next();
                }
                throw error;
            }
        };
    }

    private async _sendFromCache(context: Context, pathname: string) {
        const config = this.frugal.config;

        const pagePath = path.join(config.publicDir, pathname);
        const content = await config.pagePersistance.get(pagePath);

        context.response.status = 200;
        context.response.body = content;
    }

    private _refreshJitMiddleware() {
        return async (context: Context, next: () => Promise<unknown>) => {
            const ctx = context as StaticContext;
            assert(ctx.refresher);

            const url = context.request.url;
            await ctx.refresher.refresh(url.pathname);

            return await this._sendFromCache(context, url.pathname);
        };
    }
}
