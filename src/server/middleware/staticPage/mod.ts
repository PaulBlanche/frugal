import { RouteContext } from "../RouteContext.ts";
import { StaticRoute } from "../../../page/Router.ts";
import { composeMiddleware } from "../../Middleware.ts";

import { cache } from "./cache.ts";
import { watchModeRefresh } from "./watchModeRefresh.ts";
import { refresh } from "./refresh.ts";
import { refreshJit } from "./refreshJit.ts";
import { forceGenerate } from "./forceGenerate.ts";

export const staticPage = composeMiddleware<RouteContext<StaticRoute>>(
    forceGenerate,
    refresh,
    watchModeRefresh,
    cache,
    refreshJit,
);
