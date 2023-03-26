import { FrugalError } from '../FrugalError.ts';
import { Config } from '../Config.ts';
import { log } from '../log.ts';
import { compile, DynamicPage, StaticPage } from './Page.ts';
import { PageBuilder } from './PageBuilder.ts';
import { PageRefresher } from './PageRefresher.ts';
import { PageGenerator } from './PageGenerator.ts';
import { ResponseCache } from './ResponseCache.ts';

type BaseRoute = {
    name: string;
    generator: PageGenerator;
};

/**
 * A page and its generator, builder and refresher
 */
export type StaticRoute = BaseRoute & {
    type: 'static';
    page: StaticPage;
    builder: PageBuilder;
    refresher: PageRefresher;
};

/**
 * A page and its generator
 */
export type DynamicRoute = BaseRoute & {
    type: 'dynamic';
    page: DynamicPage;
};

export type Route = StaticRoute | DynamicRoute;

export type RoutablePage = {
    name: string;
    url: URL;
    hash: string;
};

export type RouterConfig = {
    pages: RoutablePage[];
    assets: Record<string, any>;
};

/**
 * A class handling the matching of a pathname with a page
 */
export class Router {
    #routes: Route[];
    #config: Config;
    #responseCache: ResponseCache;

    constructor(config: Config, responseCache: ResponseCache) {
        this.#routes = [];
        this.#config = config;
        this.#responseCache = responseCache;
    }

    get responseCache() {
        return this.#responseCache;
    }

    async setup(config: RouterConfig) {
        await Promise.all(config.pages.map(async (routablePage) => {
            const pageDescriptor = await import(routablePage.url.href);
            const page = compile(routablePage.name, pageDescriptor);

            const alreadyMatchingRoute = this.#routes.find((route) =>
                route.page.pattern === page.pattern
            );
            if (alreadyMatchingRoute !== undefined) {
                throw new FrugalError(
                    `pattern "${page.pattern}" was registered both for pages "${routablePage.name}" and "${alreadyMatchingRoute.name}"`,
                );
            }

            const generator = new PageGenerator({
                page,
                assets: config.assets,
                descriptor: routablePage.name,
                watch: this.#config.isDevMode,
            });

            if (page instanceof StaticPage) {
                const builder = new PageBuilder({
                    page,
                    name: routablePage.name,
                    hash: routablePage.hash,
                    generator,
                    cache: this.#responseCache,
                });

                const refresher = new PageRefresher({
                    page,
                    builder,
                });

                this.#routes.push({
                    type: 'static',
                    name: routablePage.name,
                    page,
                    generator,
                    builder,
                    refresher,
                });
            } else {
                this.#routes.push({
                    type: 'dynamic',
                    name: routablePage.name,
                    page,
                    generator,
                });
            }
        }));

        log('setup router with routes', {
            scope: 'Router',
            kind: 'info',
            extra: this.#routes.map((route) =>
                `descriptor "${route.name}" with pattern "${route.page.pattern}"`
            ).join('\n'),
        });
    }

    /**
     * Returns the route matching the given pathname.
     */
    getMatchingRoute(pathname: string): Route | undefined {
        let matchedRoute: Route | undefined = undefined;
        for (const route of this.#routes) {
            if (route.page.match(pathname)) {
                if (matchedRoute === undefined) {
                    matchedRoute = route;
                    if (!this.#config.isDevMode) {
                        return matchedRoute;
                    }
                } else {
                    log(
                        `routes "${matchedRoute.name}" and "${route.name}" both matched the pathname "${pathname}"`,
                        {
                            kind: 'warning',
                            scope: 'Router',
                        },
                    );
                }
            }
        }
        return matchedRoute;
    }

    get routes() {
        return this.#routes;
    }
}
