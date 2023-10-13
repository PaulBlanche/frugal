import { composeMiddleware } from "../../Middleware.js";

import { cache } from "./cache.js";
import { watchModeRefresh } from "./watchModeRefresh.js";
import { refresh } from "./refresh.js";
import { refreshJit } from "./refreshJit.js";
import { forceGenerate } from "./forceGenerate.js";

export const staticPage = composeMiddleware(
    forceGenerate,
    refresh,
    watchModeRefresh,
    cache,
    refreshJit,
);
