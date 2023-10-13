import * as http from "../../../../dependencies/http.js";

import { toResponse } from "../../../page/GenerationResult.js";
import { FORCE_GENERATE_COOKIE } from "../../../page/Response.js";
import * as router from "../../../page/Router.js";
import * as middleware from "../../Middleware.js";
import * as routeContext from "../RouteContext.js";

/**
 * @param {routeContext.RouteContext<router.StaticRoute>} context
 * @param {middleware.Next<routeContext.RouteContext<router.StaticRoute>>} next
 */
export async function forceGenerate(context, next) {
    const cookies = http.getCookies(context.request.headers);
    const forceGenerate = cookies[FORCE_GENERATE_COOKIE] === "true";

    if (!forceGenerate && context.request.method === "GET") {
        return next(context);
    }

    context.log("Force dynamic generation of static page.", {
        scope: "forceGenerate",
        level: "debug",
    });

    const generationResult = await context.route.generator.generate(
        "dynamic",
        context.request,
        context.state,
        context.session,
    );

    if (generationResult === undefined) {
        return next(context);
    }
    const response = await toResponse(generationResult);

    if (forceGenerate) {
        http.setCookie(response.headers, {
            httpOnly: true,
            name: FORCE_GENERATE_COOKIE,
            value: "false",
            expires: new Date(0),
            maxAge: 0,
        });
    }

    return response;
}
