import { toResponse } from "../../page/GenerationResult.js";
import * as router from "../../page/Router.js";
import * as middleware from "../Middleware.js";
import * as routeContext from "./RouteContext.js";

/**
 * @param {routeContext.RouteContext<router.DynamicRoute>} context
 * @param {middleware.Next<routeContext.RouteContext<router.DynamicRoute>>} next
 * @returns
 */
export async function dynamicPage(context, next) {
    context.log(`Generation of dynamic page`, { level: "debug", scope: "dynamicPage" });

    const generationResult = await context.route.generator.generate(
        context.request,
        context.state,
        context.session,
    );

    if (generationResult === undefined) {
        return next(context);
    }

    return await toResponse(generationResult);
}
