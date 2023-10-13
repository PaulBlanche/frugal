import { FrugalConfig } from "../../Config.js";
import { RuntimeCache } from "../../cache/Cache.js";
import { log } from "../../log.js";
import { Router } from "../../page/Router.js";
import { Session } from "../session/Session.js";
import { HandlerInfo } from "./Server.js";

export type Context = {
    request: Request;
    info: HandlerInfo;
    resolve: (path: string) => string;
    secure: boolean;
    state: Record<string, unknown>;
    config: FrugalConfig;
    router: Router;
    watchMode: boolean;
    cache: RuntimeCache;
    session?: Session;
    log: typeof log;
};
