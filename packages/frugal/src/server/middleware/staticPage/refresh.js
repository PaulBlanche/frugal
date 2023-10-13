import * as router from "../../../page/Router.js";
import * as middleware from "../../Middleware.js";
import * as routeContext from "../RouteContext.js";
import { verify } from "../../crypto.js";

/**
 * @param {routeContext.RouteContext<router.StaticRoute>} context
 * @param {middleware.Next<routeContext.RouteContext<router.StaticRoute>>} next
 */
export async function refresh(context, next) {
    const cryptoKey = context.config.server.cryptoKey;
    if (cryptoKey === undefined) {
        context.log(`no crypto key in config. Yield.`, {
            level: "debug",
            scope: "forceRefresh",
        });

        return next(context);
    }

    if (context.request.method !== "GET") {
        return next(context);
    }

    const url = new URL(context.request.url);
    const timestamp = url.searchParams.get("timestamp");
    const signature = url.searchParams.get("sign");

    if (!timestamp || !signature) {
        context.log(`Missing parameters for force refresh. Yield.`, {
            level: "debug",
            scope: "forceRefresh",
        });

        return next(context);
    }

    const delta = Math.abs(Date.now() - Number(timestamp));

    if (delta > 2 * 1000) {
        context.log(`Request has expired timestamp. Yield.`, {
            level: "debug",
            scope: "forceRefresh",
        });

        return next(context);
    }

    const verified = await verify(cryptoKey, signature, timestamp);

    if (!verified) {
        context.log(`Request has invalid signature. Yield.`, {
            level: "debug",
            scope: "forceRefresh",
        });

        return next(context);
    }

    await context.route.generator.refresh(context.request);

    const redirectionUrl = new URL(url);

    return new Response(null, {
        status: 303,
        headers: {
            Location: redirectionUrl.pathname,
        },
    });
}
