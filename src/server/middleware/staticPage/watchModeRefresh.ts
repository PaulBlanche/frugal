import { StaticRoute } from "../../../page/Router.ts";
import { Next } from "../../Middleware.ts";
import { RouteContext } from "../RouteContext.ts";

export async function watchModeRefresh(context: RouteContext<StaticRoute>, next: Next<RouteContext<StaticRoute>>) {
    if (!context.watchMode) {
        return next(context);
    }

    const url = new URL(context.request.url);
    const cachedResponse = await context.cache.get(url.pathname);

    if (context.route.page.strictPaths && cachedResponse === undefined) {
        context.log("Path was not generated during build and page do not allow JIT generation. Yield.", {
            level: "debug",
            scope: "watchModeRefresh",
        });

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

    return await generationResult.toResponse();
}
