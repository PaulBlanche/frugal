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
        this.#populateScriptURL = new URL("populate.mjs", this.#config.cachedir);
    }

    async export() {
        log("Exporting website for Deno Deploy", { scope: "DenoDeployExporter", level: "info" });

        await this.#populateScript();
        await this.#entrypointScript();
        if (this.#config.importMapURL) {
            await fs.copy(this.#config.importMapURL, new URL("import_map.json", this.#config.outdir));
        }
    }

    async #populateScript() {
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
        const outDir = path.fromFileUrl(this.#config.outdir);

        const serverScriptURL = new URL("entrypoint.mjs", this.#config.outdir);

        const cacheStorageInstance = this.#cacheStorageCreator.instance();

        await Deno.writeTextFile(
            serverScriptURL,
            `
import { Router } from "${new URL("../page/Router.ts", import.meta.url).href}";
import { FrugalServer } from "${new URL("../server/FrugalServer.ts", import.meta.url).href}";
import { RuntimeStorageCache } from "${new URL("../cache/RuntimeStorageCache.ts", import.meta.url).href}";
import { FrugalConfig } from "${new URL("../Config.ts", import.meta.url).href}";
import { loadManifest } from "${new URL("../Manifest.ts", import.meta.url).href}";
import { ${cacheStorageInstance.import.name} as CacheStorage } from "${cacheStorageInstance.import.url}";

import userConfig from "./${path.relative(outDir, path.fromFileUrl(this.#config.self))}"

const config = new FrugalConfig(userConfig)
const manifest = await loadManifest(config)

const cacheStorage = new CacheStorage(${cacheStorageInstance.instanceParams("config", "manifest").join(", ")})
const cache = new RuntimeStorageCache(cacheStorage)

const router = new Router({ config, manifest, cache })

const current = await cacheStorage.get("__frugal__current")
if (current !== router.id) {
    console.log('populate')
    const { populate } = await import("./${path.relative(outDir, path.fromFileUrl(this.#populateScriptURL))}")
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
