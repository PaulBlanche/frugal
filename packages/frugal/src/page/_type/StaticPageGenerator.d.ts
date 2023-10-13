import * as page from "../Page.js";
import { JSONValue } from "./JSONValue.js";
import { Cache } from "../../cache/Cache.js";
import { FrugalConfig } from "../../Config.js";
import { AssetRepository } from "../Assets.js";

type StaticPageGeneratorConfig<PATH extends string = string, DATA extends JSONValue = JSONValue> = {
    page: page.StaticPage<PATH, DATA>;
    assets: AssetRepository;
    configHash: string;
    cache: Cache;
    config: FrugalConfig;
};
