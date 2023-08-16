import { DynamicRoute, StaticRoute } from "../../page/Router.ts";
import { Context } from "../Context.ts";
import { composeMiddleware, Next } from "../Middleware.ts";
import { RouteContext } from "./RouteContext.ts";
import { dynamicPage } from "./dynamicPage/mod.ts";
import { etag } from "./etag.ts";
import { staticPage } from "./staticPage/mod.ts";

export function route(context: Context, next: Next<Context>) {
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
        context.log(
            `Page ${route.page.pattern} can\'t handle ${method}. Yield.`,
            {
                level: "debug",
                scope: "route",
            },
        );

        return next(context);
    }

    context.session?.persist();

    return composedMiddleware(
        { ...context, route },
        next,
    );
}

function staticOrDynamic(context: RouteContext, next: Next<RouteContext>) {
    switch (context.route.type) {
        case "dynamic": {
            return dynamicPage(context as RouteContext<DynamicRoute>, next);
        }
        case "static": {
            return staticPage(context as RouteContext<StaticRoute>, next);
        }
    }
}

const composedMiddleware = composeMiddleware<RouteContext>(
    //csrf,
    etag,
    staticOrDynamic,
);
