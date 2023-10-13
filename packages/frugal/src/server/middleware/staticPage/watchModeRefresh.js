import { toResponse } from "../../../page/GenerationResult.js";
import * as router from "../../../page/Router.js";
import * as middleware from "../../Middleware.js";
import * as routeContext from "../RouteContext.js";

/**
 * @param {routeContext.RouteContext<router.StaticRoute>} context
 * @param {middleware.Next<routeContext.RouteContext<router.StaticRoute>>} next
 * @returns
 */
export async function watchModeRefresh(context, next) {
    if (!context.watchMode) {
        return next(context);
    }

    const url = new URL(context.request.url);
    const cachedResponse = await context.cache.get(url.pathname);

    if (context.route.page.strictPaths && cachedResponse === undefined) {
        context.log(
            "Path was not generated during build and page do not allow JIT generation. Yield.",
            {
                level: "debug",
                scope: "watchModeRefresh",
            },
        );

        return next(context);
    }

    context.log(`Refreshing static page for dev mode`, {
        level: "debug",
        scope: "watchModeRefresh",
    });

    const generationResult = await context.route.generator.generate(
        "static",
        context.request,
        context.state,
        context.session,
    );

    if (generationResult === undefined) {
        return next(context);
    }

    await context.cache.add(generationResult);

    return await toResponse(generationResult);
}
