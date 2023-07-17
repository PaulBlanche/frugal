import { DynamicRoute } from "../../../page/Router.ts";
import { Next } from "../../Middleware.ts";
import { RouteContext } from "../RouteContext.ts";

export async function dynamicPage(
    context: RouteContext<DynamicRoute>,
    _next: Next<RouteContext<DynamicRoute>>,
) {
    context.log(`Generation of dynamic page`, { level: "debug", scope: "dynamicPage" });

    const generationResult = await context.route.generator.generate(
        context.request,
        context.state,
        context.session,
    );

    return await generationResult.toResponse();
}
