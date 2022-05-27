import * as oak from 'oak';
import { FrugalInstance } from '../core/mod.ts';
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

/**
 * An oak Router where all dynamic routes in a Frugal instance are registered.
 *
 * The router handle GET methods for each route. If the page of a route has a
 * `postDynamicData` method, the router also handle POST method for this route.
 */
export class DynamicRouter {
    #router: oak.Router;
    #frugal: FrugalInstance;
    #prgOrchestrator: PrgOrchestrator;

    constructor(
        frugal: FrugalInstance,
        prgOrchestrator: PrgOrchestrator,
    ) {
        this.#router = new oak.Router();
        this.#frugal = frugal;
        this.#prgOrchestrator = prgOrchestrator;

        this.#register(this.#router);
    }

    /**
     * Return the route middleware from the underlying oak Router.
     */
    routes() {
        return this.#router.routes();
    }

    /**
     * Return the allowed method middleware from the underlying oak Router.
     */
    allowedMethods() {
        return this.#router.allowedMethods();
    }

    #register(router: oak.Router) {
        const prgRedirectionMiddleware = this.#prgOrchestrator.getRedirection();
        const prgPostMiddleware = this.#prgOrchestrator.post();

        const getMiddleware = oak.composeMiddleware([
            // start of "user flow", first try PRG if needed
            prgRedirectionMiddleware,
            // then generate the page
            generateMiddleware(),
        ]);

        const postMiddleware = oak.composeMiddleware([
            prgPostMiddleware,
        ]);

        for (const route of this.#frugal.routes) {
            if (route.type === 'static' && !this.#frugal.config.watch) {
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
}

function generateMiddleware() {
    return async (context: oak.Context, _next: () => Promise<unknown>) => {
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

        const result = await ctx.generator.generate({
            url: context.request.url,
            headers: context.request.headers,
            method: 'GET',
            body: context.request.body(),
        });

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
