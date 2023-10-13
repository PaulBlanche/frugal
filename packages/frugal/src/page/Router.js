import * as _type from "./_type/Router.js";
export * from "./_type/Router.js";

import * as page from "./Page.js";
import { DynamicPageGenerator } from "./DynamicPageGenerator.js";
import { StaticPageGenerator } from "./StaticPageGenerator.js";
import { log } from "../log.js";

export class Router {
    /** @type {_type.Route[]} */
    #routes;
    /** @type {_type.RouterConfig} */
    #config;

    /** @param {_type.RouterConfig} config */
    constructor(config) {
        this.#config = config;

        this.#routes = this.#config.manifest.pages.map(({ descriptor, entrypoint, moduleHash }) => {
            log(`Compile page "${entrypoint}" (${moduleHash})`, {
                scope: "Router",
                level: "debug",
            });
            const compiledPage = page.compile(entrypoint, moduleHash, descriptor);

            if (compiledPage.type === "static") {
                return {
                    type: "static",
                    moduleHash,
                    page: compiledPage,
                    generator: new StaticPageGenerator({
                        page: compiledPage,
                        assets: this.#config.manifest.assets,
                        configHash: this.#config.manifest.config,
                        cache: this.#config.cache,
                        config: this.#config.config,
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
                        config: this.#config.config,
                    }),
                };
            }
        });
    }

    get id() {
        return this.#config.manifest.id;
    }

    buildAllStaticRoutes() {
        return Promise.all(
            this.#routes.map(async (route) => {
                if (route.type === "static") {
                    await route.generator.buildAll();
                }
            }),
        );
    }

    /**
     * @param {string} pathname
     * @returns {_type.Route | undefined}
     */
    getMatchingRoute(pathname) {
        /** @type {_type.Route | undefined} */
        let matchedRoute = undefined;
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
