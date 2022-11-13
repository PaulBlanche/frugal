import { DynamicPage, Page, StaticPage } from './Page.ts';
import { PageBuilder } from './PageBuilder.ts';
import { PageRefresher } from './PageRefresher.ts';
import { PageGenerator } from './PageGenerator.ts';
import { LoaderContext } from './LoaderContext.ts';
import { CleanConfig } from './Config.ts';
import { assert } from '../../dep/std/asserts.ts';
import { ModuleList } from './DependencyGraph.ts';
import { PersistentCache } from './Cache.ts';

type BaseRoute = {
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

/**
 * A class handling the matching of a pathname with a page
 */
export class Router {
    #routes: Route[];

    constructor(
        config: CleanConfig,
        moduleList: ModuleList,
        cache: PersistentCache,
        loaderContext: LoaderContext,
    ) {
        this.#routes = [];

        for (const page of config.pages) {
            if (isStaticPage(page)) {
                const generator = new PageGenerator(page, {
                    loaderContext,
                    publicDir: config.publicDir,
                    watch: config.watch,
                });

                const module = moduleList.get(page.self);
                const pageHash = module?.moduleHash ?? String(Math.random());

                const builder = new PageBuilder(page, pageHash, generator, {
                    cache,
                    persistence: config.pagePersistence,
                });

                const refresher = new PageRefresher(
                    page,
                    builder,
                );

                assert(!(page.pattern in this.#routes));
                this.#routes.push({
                    type: 'static',
                    page,
                    generator,
                    builder,
                    refresher,
                });
            } else if (isDynamicPage(page)) {
                const generator = new PageGenerator(page, {
                    loaderContext,
                    publicDir: config.publicDir,
                    watch: config.watch,
                });

                assert(!(page.pattern in this.#routes));
                this.#routes.push({ type: 'dynamic', page, generator });
            }
        }
    }

    /**
     * Returns the route matching the given pathname.
     */
    getMatchingRoute(pathname: string) {
        for (const route of this.#routes) {
            if (route.page.match(pathname)) {
                return route;
            }
        }
    }

    get routes() {
        return this.#routes;
    }
}

function isStaticPage(page: Page): page is StaticPage {
    return page instanceof StaticPage;
}

function isDynamicPage(page: Page): page is DynamicPage {
    return page instanceof DynamicPage;
}
