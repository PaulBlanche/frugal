import * as http from "../../dep/std/http.ts";

import { FrugalConfig } from "../Config.ts";
import { RuntimeCache } from "../cache/Cache.ts";
import { log } from "../log.ts";
import { Router } from "../page/Router.ts";
import { Session } from "./session/Session.ts";

export type Context = {
    request: Request;
    resolve: (path: string) => string;
    connInfo: http.ConnInfo;
    secure: boolean;
    state: Record<string, unknown>;
    config: FrugalConfig;
    router: Router;
    watchMode: boolean;
    cache: RuntimeCache;
    session?: Session;
    log: typeof log;
};
