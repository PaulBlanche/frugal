import * as http from "../../../../dep/std/http.ts";

import { FORCE_GENERATE_COOKIE } from "../../../page/Response.ts";
import { StaticRoute } from "../../../page/Router.ts";
import { Next } from "../../Middleware.ts";
import { RouteContext } from "../RouteContext.ts";

export async function forceGenerate(
    context: RouteContext<StaticRoute>,
    next: Next<RouteContext<StaticRoute>>,
) {
    const cookies = http.getCookies(context.request.headers);
    const forceGenerate = cookies[FORCE_GENERATE_COOKIE] === "true";

    if (!forceGenerate && context.request.method === "GET") {
        return next(context);
    }

    context.log(
        "Force dynamic generation of static page.",
        { scope: "forceGenerate", level: "debug" },
    );

    const generationResult = await context.route.generator.generate(
        "dynamic",
        context.request,
        context.state,
        context.session,
    );

    if (generationResult === undefined) {
        return next(context);
    }

    const response = await generationResult.toResponse();

    if (forceGenerate) {
        http.setCookie(response.headers, {
            httpOnly: true,
            name: FORCE_GENERATE_COOKIE,
            value: "false",
            expires: new Date(0),
        });
    }

    return response;
}
