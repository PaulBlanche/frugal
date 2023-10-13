import { FrugalConfig } from "../../Config.js";
import { RuntimeCache } from "../../cache/Cache.js";
import { Router } from "../../page/Router.js";

export type FrugalServerInit = {
    cache: RuntimeCache;
    config: FrugalConfig;
    router: Router;
    watchMode: boolean;
};
