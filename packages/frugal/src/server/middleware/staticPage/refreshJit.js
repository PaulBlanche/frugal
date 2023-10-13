import * as router from "../../../page/Router.js";
import * as middleware from "../../Middleware.js";
import * as routeContext from "../RouteContext.js";
import { cache } from "./cache.js";

/**
 * @param {routeContext.RouteContext<router.StaticRoute>} context
 * @param {middleware.Next<routeContext.RouteContext<router.StaticRoute>>} next
 * @returns
 */
export async function refreshJit(context, next) {
    if (context.route.page.strictPaths) {
        return next(context);
    }

    if (context.request.method !== "GET") {
        return next(context);
    }

    context.log(`refresh page`, {
        level: "debug",
        scope: "refreshJit",
    });

    await context.route.generator.refresh(context.request);

    return cache(context, next);
}
