import * as page from "./Page.ts";
import { DynamicPageGenerator } from "./DynamicPageGenerator.ts";
import { StaticPageGenerator } from "./StaticPageGenerator.ts";
import { FrugalConfig } from "../Config.ts";
import { Cache } from "../cache/Cache.ts";
import { log } from "../log.ts";
import { LoadedManifest } from "../loadManifest.ts";

export type StaticRoute = {
    type: "static";
    moduleHash: string;
    page: page.StaticPage;
    generator: StaticPageGenerator;
};

export type DynamicRoute = {
    type: "dynamic";
    moduleHash: string;
    page: page.DynamicPage;
    generator: DynamicPageGenerator;
};

export type Route = StaticRoute | DynamicRoute;

type RouterConfig = {
    config: FrugalConfig;
    manifest: LoadedManifest;
    cache: Cache;
    watch?: boolean;
};

export class Router {
    #routes: Route[];
    #config: RouterConfig;

    constructor(config: RouterConfig) {
        this.#config = config;

        this.#routes = this.#config.manifest.pages.map(({ descriptor, entrypoint, moduleHash }) => {
            log(`Compile page "${entrypoint}" (${moduleHash})`, { scope: "Router", level: "debug" });
            const compiledPage = page.compile(
                entrypoint,
                moduleHash,
                descriptor,
            );
            if (compiledPage instanceof page.StaticPage) {
                return {
                    type: "static",
                    moduleHash,
                    page: compiledPage,
                    generator: new StaticPageGenerator({
                        page: compiledPage,
                        assets: this.#config.manifest.assets,
                        configHash: this.#config.manifest.config,
                        cache: this.#config.cache,
                    }),
                };
            } else {
                return {
                    type: "dynamic",
                    moduleHash,
                    page: compiledPage,
                    generator: new DynamicPageGenerator({
                        page: compiledPage,
                        assets: this.#config.manifest.assets,
                        configHash: this.#config.manifest.config,
                    }),
                };
            }
        });
    }

    get routes() {
        return this.#routes;
    }

    getMatchingRoute(pathname: string): Route | undefined {
        let matchedRoute: Route | undefined = undefined;
        for (const route of this.#routes) {
            if (route.page.match(pathname)) {
                if (matchedRoute === undefined) {
                    matchedRoute = route;
                    if (!this.#config.watch) {
                        return matchedRoute;
                    }
                } else {
                    log(
                        `routes "${matchedRoute.page.entrypoint}" and "${matchedRoute.page.entrypoint}" both matched the pathname "${pathname}"`,
                        {
                            level: "warning",
                            scope: "Router",
                        },
                    );
                }
            }
        }

        return matchedRoute;
    }
}
