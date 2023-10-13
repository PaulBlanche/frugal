import * as _type from "./_type/Plugin.js";
export * from "./_type/Plugin.js";

import * as esbuild from "../dependencies/esbuild.js";

import * as config from "./Config.js";
import * as assetCollector from "./AssetCollector.js";
import * as assets from "./page/Assets.js";

export class Context {
    /** @type {config.FrugalConfig} */
    #config;
    /** @type {assets.AssetRepository} */
    #assets;

    /** @param {config.FrugalConfig} config */
    constructor(config) {
        this.#config = config;
        this.#assets = {};
    }

    get config() {
        return this.#config;
    }

    /**
     * @param {string} type
     * @param {assets.AssetType} asset
     */
    output(type, asset) {
        this.#assets[type] = this.#assets[type] ?? [];
        this.#assets[type].push(asset);
    }

    /**
     * @param {RegExp} filter
     * @param {esbuild.Metafile} metafile
     * @returns {assetCollector.Asset[]}
     */
    collect(filter, metafile) {
        return new assetCollector.AssetCollector(this.#config, metafile).collect(filter);
    }

    get assets() {
        return this.#assets;
    }

    reset() {
        this.#assets = {};
    }
}
