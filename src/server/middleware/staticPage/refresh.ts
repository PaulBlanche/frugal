import * as http from "../../../../dep/std/http.ts";

import { StaticRoute } from "../../../page/Router.ts";
import { Next } from "../../Middleware.ts";
import { RouteContext } from "../RouteContext.ts";
import { verify } from "../../crypto.ts";

export async function refresh(
    context: RouteContext<StaticRoute>,
    next: Next<RouteContext<StaticRoute>>,
) {
    const cryptoKey = context.config.server.cryptoKey;
    if (cryptoKey === undefined) {
        context.log(`no crypto key in config. Yield.`, {
            level: "debug",
            scope: "forceRefresh",
        });

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
        context.log(
            `Request has invalid signature. Yield.`,
            {
                level: "debug",
                scope: "forceRefresh",
            },
        );

        return next(context);
    }

    await context.route.generator.refresh(context.request);

    const redirectionUrl = new URL(url);

    return new Response(null, {
        status: http.Status.SeeOther,
        headers: {
            Location: redirectionUrl.pathname,
        },
    });
}
