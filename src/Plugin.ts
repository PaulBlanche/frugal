import * as esbuild from "../dep/esbuild.ts";
import * as path from "../dep/std/path.ts";

import type { FrugalConfig } from "./Config.ts";
import { Asset, AssetCollector } from "./AssetCollector.ts";
import { Loader } from "./Loader.ts";
import { AssetRepository, AssetType } from "./page/Assets.ts";

export type Output = (type: string, asset: AssetType) => void;

export type Build = {
    config: FrugalConfig;
    url: (args: { namespace: string; path: string }) => URL;
    load: (specifier: URL) => Promise<Uint8Array>;
    output: Output;
    collect: (filter: RegExp, metafile: esbuild.Metafile) => Asset[];
};

export class PluginContext implements Build {
    #config: FrugalConfig;
    #loader: Loader;
    #assets: AssetRepository;

    constructor(config: FrugalConfig) {
        this.#config = config;
        this.#loader = new Loader();
        this.#assets = {};
    }

    get config() {
        return this.#config;
    }

    url(args: { namespace: string; path: string }) {
        return args.namespace === "file" ? path.toFileUrl(args.path) : new URL(`${args.namespace}:${args.path}`);
    }

    load(url: URL) {
        return this.#loader.load(url);
    }

    output(type: string, asset: AssetType) {
        this.#assets[type] = asset;
    }

    collect(filter: RegExp, metafile: esbuild.Metafile) {
        return new AssetCollector(this.#config, metafile).collect(filter);
    }

    get assets() {
        return this.#assets;
    }

    reset() {
        this.#assets = {};
    }
}

export type Plugin = (build: Build) => esbuild.Plugin;
