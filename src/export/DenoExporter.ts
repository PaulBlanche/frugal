import * as path from "../../dep/std/path.ts";

import { log } from "../log.ts";
import { ExportContext } from "./Export.ts";
import { getManifestURL } from "../loadManifest.ts";
import { FrugalConfig } from "../Config.ts";
import { BuildCacheSnapshot } from "../cache/BuildCacheSnapshot.ts";

export class DenoExporter {
    #config: FrugalConfig;
    #snapshot: BuildCacheSnapshot;

    static export(context: ExportContext) {
        return new DenoExporter(context).export();
    }

    constructor({ config, snapshot }: ExportContext) {
        this.#config = config;
        this.#snapshot = snapshot;
    }

    async export() {
        log("Exporting website for Deno Deploy", { scope: "DenoDeployExporter", level: "info" });

        const manifestPath = path.fromFileUrl(getManifestURL(this.#config));
        const serverScriptURL = new URL("entrypoint.js", this.#config.cachedir);
        const cacheDir = path.fromFileUrl(this.#config.cachedir);
        const populateScriptURL = new URL("populate.js", this.#config.cachedir);

        await Deno.writeTextFile(
            populateScriptURL,
            `import * as manifest from "./${path.relative(cacheDir, manifestPath)}"
import { FrugalConfig } from "${new URL("../Config.ts", import.meta.url).href}";
import config from "./${path.relative(cacheDir, path.fromFileUrl(this.#config.self))}"
            
const frugalConfig = new FrugalConfig(config)

${
                this.#snapshot.current.map((value) => {
                    return `await frugalConfig.cacheStorage.set("${value.path}", JSON.stringify(${
                        JSON.stringify(value)
                    }));`;
                }).join("\n")
            }
            await frugalConfig.cacheStorage.set("__frugal__current", manifest.id)

        `,
        );

        await Deno.writeTextFile(
            serverScriptURL,
            `import * as manifest from "./${path.relative(cacheDir, manifestPath)}"
import { Router } from "${new URL("../page/Router.ts", import.meta.url).href}";
import { FrugalServer } from "${new URL("../server/FrugalServer.ts", import.meta.url).href}";
import { StorageCache } from "${new URL("../cache/StorageCache.ts", import.meta.url).href}";
import { FrugalConfig } from "${new URL("../Config.ts", import.meta.url).href}";
import config from "./${path.relative(cacheDir, path.fromFileUrl(this.#config.self))}"

const frugalConfig = new FrugalConfig(config)

const current = await frugalConfig.cacheStorage.get("__frugal__current")
if (current !== manifest.id) {
    console.log('populate')
    await import("./${path.relative(cacheDir, path.fromFileUrl(populateScriptURL))}")
}


const cache = new StorageCache(frugalConfig)

const router = new Router({
    config: frugalConfig,
    manifest,
    cache,
});

const server = new FrugalServer({
    config: frugalConfig,
    router,
    cache,
    watchMode: false,
});

server.serve()
                 
            `,
        );
    }
}
