import { composeMiddleware, Context, Router } from 'oak';
import { Frugal } from '../core/mod.ts';
import * as log from '../log/mod.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';
import { DynamicContext } from './FrugalContext.ts';
import { assert } from '../../dep/std/asserts.ts';

function logger(middleware?: string) {
    if (middleware === undefined) {
        return log.getLogger('frugal_oak:DynamicRouter');
    }
    return log.getLogger(`frugal_oak:DynamicRouter:${middleware}`);
}

export class DynamicRouter {
    router: Router;
    frugal: Frugal;
    prgOrchestrator: PrgOrchestrator;

    constructor(
        frugal: Frugal,
        prgOrchestrator: PrgOrchestrator,
    ) {
        this.router = new Router();
        this.frugal = frugal;
        this.prgOrchestrator = prgOrchestrator;

        this._register(this.router);
    }

    routes() {
        return this.router.routes();
    }

    allowedMethods() {
        return this.router.allowedMethods();
    }

    private _register(router: Router) {
        const prgRedirectionMiddleware = this.prgOrchestrator.getRedirection();
        const prgPostMiddleware = this.prgOrchestrator.post();
        const generateMiddleware = this._generateMiddleware();

        const getMiddleware = composeMiddleware([
            // start of "user flow", first try PRG if needed
            prgRedirectionMiddleware,
            // then generate the page
            generateMiddleware,
        ]);

        const postMiddleware = composeMiddleware([
            prgPostMiddleware,
        ]);

        for (const pattern in this.frugal.routes) {
            const route = this.frugal.routes[pattern];
            if (route.type === 'static' && !this.frugal.config.devMode) {
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
                const ctx = context as DynamicContext;
                ctx.generator = route.generator;
                return await getMiddleware(context, next);
            });

            if (route.page.canPostDynamicData) {
                router.post(route.page.pattern, async (context, next) => {
                    const ctx = context as DynamicContext;
                    ctx.generator = route.generator;
                    return await postMiddleware(context, next);
                });
            }
        }
    }

    private _generateMiddleware() {
        return async (context: Context, _next: () => Promise<unknown>) => {
            const ctx = context as DynamicContext;
            assert(ctx.generator);

            const url = context.request.url;

            logger('generateMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `handle ${this.method} ${this.pathname}`;
                },
            });

            const result = await ctx.generator.generate(
                context.request.originalRequest as unknown as Request,
            );

            if (result === undefined) {
                logger('generateMiddleware').debug({
                    method: context.request.method,
                    pathname: url.pathname,
                    msg() {
                        return `handle failure for ${this.method} ${this.pathname}`;
                    },
                });

                context.response.status = 404;
                return;
            }

            logger('generateMiddleware').debug({
                method: context.request.method,
                pathname: url.pathname,
                msg() {
                    return `handle successful for ${this.method} ${this.pathname}`;
                },
            });

            context.response.status = 200;
            context.response.body = result.content;
            context.response.headers.set(
                'Cache-Control',
                'public, max-age=5, must-revalidate',
            );
        };
    }
}
