import { composeMiddleware, Context, Router } from '../../dep/oak.ts';
import { Frugal } from '../core/mod.ts';
import { PrgOrchestrator } from './PrgOrchestrator.ts';
import { DynamicContext } from './FrugalContext.ts';
import { assert } from '../../dep/std/asserts.ts';

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
            if (route.type === 'static') {
                continue;
            }

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
        return async (context: Context, next: () => Promise<unknown>) => {
            const ctx = context as DynamicContext;
            assert(ctx.generator);

            const url = context.request.url;
            const result = await ctx.generator.generate(url.pathname, {
                method: 'GET',
                searchParams: url.searchParams,
            });

            if (result === undefined) {
                context.response.status = 404;
                return;
            }

            context.response.status = 200;
            context.response.body = result.content;
        };
    }
}
