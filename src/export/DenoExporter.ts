import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";

import { log } from "../log.ts";
import { ExportContext, Exporter } from "./Export.ts";
import { CacheStorageCreator } from "../cache/CacheStorage.ts";
import { FrugalConfig } from "../Config.ts";
import { BuildCacheSnapshot } from "../cache/BuildCacheSnapshot.ts";

export class DenoExporter implements Exporter {
    #cacheStorageCreator: CacheStorageCreator;

    constructor(cacheStorageCreator: CacheStorageCreator) {
        this.#cacheStorageCreator = cacheStorageCreator;
    }

    export(context: ExportContext) {
        return new InternalExporter(context, this.#cacheStorageCreator).export();
    }
}

class InternalExporter {
    #snapshot: BuildCacheSnapshot;
    #config: FrugalConfig;
    #cacheStorageCreator: CacheStorageCreator;
    #populateScriptURL: URL;

    constructor({ snapshot, config }: ExportContext, cacheStorageCreator: CacheStorageCreator) {
        this.#snapshot = snapshot;
        this.#config = config;
        this.#cacheStorageCreator = cacheStorageCreator;
        this.#populateScriptURL = new URL("deno/populate.mjs", this.#config.outdir);
    }

    async export() {
        log("Exporting website for Deno Deploy", { scope: "DenoDeployExporter", level: "info" });

        await this.#populateScript();
        await this.#entrypointScript();
    }

    async #populateScript() {
        await fs.ensureFile(this.#populateScriptURL);
        await Deno.writeTextFile(
            this.#populateScriptURL,
            `export async function populate(cacheStorage, id) {
    await Promise.all([
        ${
                this.#snapshot.current.map((value) => {
                    return `        insert(cacheStorage, "${value.path}", ${JSON.stringify(value)})`;
                }).join(",\n")
            },
        cacheStorage.set("__frugal__current", id)
    ]);
}

async function insert(cacheStorage, path, response) {
    const body = await Deno.readTextFile(new URL(response.documentPath, "${this.#config.buildCacheFile.href}"))
    cacheStorage.set(path, JSON.stringify({...response, body }));
}
        `,
        );
    }

    async #entrypointScript() {
        const serverScriptURL = new URL("deno/entrypoint.mjs", this.#config.outdir);

        const cacheStorageInstance = this.#cacheStorageCreator.instance();

        await fs.ensureFile(serverScriptURL);
        await Deno.writeTextFile(
            serverScriptURL,
            `
import { Router } from "${resolveFrugal("../page/Router.ts", serverScriptURL)}";
import { FrugalServer } from "${resolveFrugal("../server/FrugalServer.ts", serverScriptURL)}";
import { RuntimeStorageCache } from "${resolveFrugal("../cache/RuntimeStorageCache.ts", serverScriptURL)}";
import { FrugalConfig } from "${resolveFrugal("../Config.ts", serverScriptURL)}";
import { loadManifest } from "${resolveFrugal("../Manifest.ts", serverScriptURL)}";
import { ${cacheStorageInstance.import.name} as CacheStorage } from "${
                resolveFrugal(cacheStorageInstance.import.url, serverScriptURL)
            }";

import userConfig from "${resolveFrugal(path.fromFileUrl(this.#config.self), serverScriptURL)}"

const config = new FrugalConfig(userConfig)
const manifest = await loadManifest(config, false)

const cacheStorage = new CacheStorage(${cacheStorageInstance.instanceParams("config", "manifest").join(", ")})
const cache = new RuntimeStorageCache(cacheStorage)

const router = new Router({ config, manifest, cache })

const current = await cacheStorage.get("__frugal__current")
if (current !== router.id) {
    console.log('populate')
    const { populate } = await import("./populate.mjs")
    populate(cacheStorage, router.id)
}

const server = new FrugalServer({
    config,
    router,
    cache,
    watchMode: false,
});

server.serve()
                 
            `,
        );
    }
}

function resolveFrugal(_path: string, scriptURL: string | URL) {
    const url = new URL(_path, import.meta.url);
    if (url.protocol === "file:") {
        return path.relative(path.dirname(path.fromFileUrl(scriptURL)), path.fromFileUrl(url));
    }
    return new URL("../page/Router.ts", import.meta.url).href;
}
