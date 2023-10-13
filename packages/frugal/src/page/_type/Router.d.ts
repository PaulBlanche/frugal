import * as page from "../Page.js";
import { DynamicPageGenerator } from "../DynamicPageGenerator.js";
import { StaticPageGenerator } from "../StaticPageGenerator.js";
import { FrugalConfig } from "../../Config.js";
import { Cache } from "../../cache/Cache.js";
import { Manifest } from "../../Manifest.js";

export type StaticRoute = {
    type: "static";
    moduleHash: string;
    page: page.StaticPage;
    generator: StaticPageGenerator;
};

export type DynamicRoute = {
    type: "dynamic";
    moduleHash: string;
    page: page.DynamicPage;
    generator: DynamicPageGenerator;
};

export type Route = StaticRoute | DynamicRoute;

export type RouterConfig = {
    config: FrugalConfig;
    manifest: Manifest;
    cache: Cache;
    watch?: boolean;
};
