import * as esbuild from "../dep/esbuild.ts";
import * as path from "../dep/std/path.ts";

import type { FrugalConfig } from "./Config.ts";
import { Asset, AssetCollector } from "./AssetCollector.ts";
import { Loader } from "./Loader.ts";
import { Assets } from "./page/PageDescriptor.ts";

// deno-lint-ignore no-explicit-any
export type Output = (type: string, output: any) => void;

type Build = {
    config: FrugalConfig;
    url: (args: { namespace: string; path: string }) => URL;
    load: (specifier: URL) => Promise<Uint8Array>;
    output: Output;
    collect: (filter: RegExp, metafile: esbuild.Metafile) => Asset[];
    setVirtualFile: (url: string, contents: Uint8Array | string) => void;
};

export class PluginContext implements Build {
    #config: FrugalConfig;
    #loader: Loader;
    #assets: Assets;
    #virtualFs: Map<string, Uint8Array | string>;

    constructor(config: FrugalConfig) {
        this.#config = config;
        this.#loader = new Loader();
        this.#assets = {};
        this.#virtualFs = new Map();
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

    // deno-lint-ignore no-explicit-any
    output(type: string, output: any) {
        this.#assets[type] = output;
    }

    collect(filter: RegExp, metafile: esbuild.Metafile) {
        return new AssetCollector(this.#config, metafile).collect(filter);
    }

    get assets() {
        return this.#assets;
    }

    reset() {
        this.#assets = {};
        this.#virtualFs.clear();
    }

    setVirtualFile(url: string, contents: Uint8Array | string) {
        this.#virtualFs.set(url, contents);
    }

    getVirtualFile(url: string) {
        return this.#virtualFs.get(url);
    }
}

export type Plugin = (build: Build) => esbuild.Plugin;
