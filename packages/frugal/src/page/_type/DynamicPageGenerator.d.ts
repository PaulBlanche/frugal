import * as page from "../Page.js";
import { JSONValue } from "./JSONValue.js";
import { FrugalConfig } from "../../Config.js";
import { AssetRepository } from "./Assets.js";

export type DynamicPageGeneratorConfig<
    PATH extends string = string,
    DATA extends JSONValue = JSONValue,
> = {
    page: page.Page<PATH, DATA>;
    assets: AssetRepository;
    configHash: string;
    config: FrugalConfig;
};
