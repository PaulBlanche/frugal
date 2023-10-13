import * as router from "../../page/Router.js";
import * as context from "../Context.js";
import * as middleware from "../Middleware.js";
import * as routeContext from "./RouteContext.js";
import { csrf } from "./csrf/csrf.js";
import { dynamicPage } from "./dynamicPage.js";
import { etag } from "./etag.js";
import { staticPage } from "./staticPage/staticPage.js";

/**
 * @param {context.Context} context
 * @param {middleware.Next<context.Context>} next
 * @returns
 */
export function route(context, next) {
    const url = new URL(context.request.url);
    const route = context.router.getMatchingRoute(url.pathname);

    if (route === undefined) {
        context.log(`no route found for ${url.pathname}. Yield.`, {
            level: "debug",
            scope: "route",
        });

        return next(context);
    }

    // route can't handle the request method, yield
    const method = context.request.method;
    if (!(method in route.page) && method !== "GET" && route.type !== "static") {
        context.log(`Page ${route.page.route} can\'t handle ${method}. Yield.`, {
            level: "debug",
            scope: "route",
        });

        return next(context);
    }

    context.session?.persist();

    return composedMiddleware({ ...context, route }, next);
}

/**
 * @param {routeContext.RouteContext} context
 * @param {middleware.Next<routeContext.RouteContext>} next
 * @returns
 */
function staticOrDynamic(context, next) {
    switch (context.route.type) {
        case "dynamic": {
            return dynamicPage(
                /** @type {routeContext.RouteContext<router.DynamicRoute>} */ (context),
                next,
            );
        }
        case "static": {
            return staticPage(
                /** @type {routeContext.RouteContext<router.StaticRoute>} */ (context),
                next,
            );
        }
    }
}

const composedMiddleware = middleware.composeMiddleware(csrf, etag, staticOrDynamic);
