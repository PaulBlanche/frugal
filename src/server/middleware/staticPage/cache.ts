import { StaticRoute } from "../../../page/Router.ts";
import { Next } from "../../Middleware.ts";
import { RouteContext } from "../RouteContext.ts";

export async function cache(context: RouteContext<StaticRoute>, next: Next<RouteContext<StaticRoute>>) {
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
