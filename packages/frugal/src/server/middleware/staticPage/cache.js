import * as router from "../../../page/Router.js";
import * as middleware from "../../Middleware.js";
import * as routeContext from "../RouteContext.js";

/**
 * @param {routeContext.RouteContext<router.StaticRoute>} context
 * @param {middleware.Next<routeContext.RouteContext<router.StaticRoute>>} next
 */
export async function cache(context, next) {
    if (context.request.method !== "GET") {
        return next(context);
    }

    const url = new URL(context.request.url);
    const cachedResponse = await context.cache.get(url.pathname);

    if (cachedResponse === undefined) {
        return next(context);
    }

    context.log(`Serving page from cache`, {
        level: "debug",
        scope: "cache",
    });

    return cachedResponse;
}
