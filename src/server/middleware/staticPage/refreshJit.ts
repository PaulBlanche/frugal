import { StaticRoute } from "../../../page/Router.ts";
import { Next } from "../../Middleware.ts";
import { RouteContext } from "../RouteContext.ts";
import { cache } from "./cache.ts";

export async function refreshJit(
    context: RouteContext<StaticRoute>,
    next: Next<RouteContext<StaticRoute>>,
) {
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
