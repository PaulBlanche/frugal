import * as path from "../../dep/std/path.ts";
import * as fs from "../../dep/std/fs.ts";

import { log } from "../log.ts";
import { ExportContext, Exporter } from "./Export.ts";
import { CacheStorageCreator } from "../cache/CacheStorage.ts";
import { FrugalConfig } from "../Config.ts";
import { BuildCacheSnapshot } from "../cache/BuildCacheSnapshot.ts";
import { getManifestName } from "../Manifest.ts";

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
    #populateScriptPath: string;

    constructor({ snapshot, config }: ExportContext, cacheStorageCreator: CacheStorageCreator) {
        this.#snapshot = snapshot;
        this.#config = config;
        this.#cacheStorageCreator = cacheStorageCreator;
        this.#populateScriptPath = path.resolve(this.#config.outdir, "deno", "populate.mjs");
    }

    async export() {
        log("Exporting website for Deno Deploy", { scope: "DenoDeployExporter", level: "info" });

        await this.#populateScript();
        await this.#entrypointScript();
        await fs.copy(
            path.resolve(this.#config.cachedir, "buildcache"),
            path.resolve(this.#config.outdir, "deno", "buildcache"),
            {
                overwrite: true,
            },
        );
    }

    async #populateScript() {
        await fs.ensureFile(this.#populateScriptPath);
        await Deno.writeTextFile(
            this.#populateScriptPath,
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

async function insert(cacheStorage, responsePath, response) {
    const body = await Deno.readTextFile(new URL(response.documentPath, import.meta.url))
    cacheStorage.set(responsePath, JSON.stringify({...response, body }));
}
`,
        );
    }

    async #entrypointScript() {
        const serverScriptPath = path.resolve(this.#config.outdir, "deno", "entrypoint.mjs");

        const cacheStorageInstance = this.#cacheStorageCreator.instance();

        const manifestName = await getManifestName(this.#config);

        const dateFormater = new Intl.DateTimeFormat("ja", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const timeFormAter = new Intl.DateTimeFormat("en", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            fractionalSecondDigits: 3,
            hour12: false,
            timeZone: "UTC",
        });
        const now = new Date();

        await fs.ensureFile(serverScriptPath);
        await Deno.writeTextFile(
            serverScriptPath,
            `
import { Router } from "${resolveFrugal("../page/Router.ts", serverScriptPath)}";
import { FrugalServer } from "${resolveFrugal("../server/FrugalServer.ts", serverScriptPath)}";
import { RuntimeStorageCache } from "${resolveFrugal("../cache/RuntimeStorageCache.ts", serverScriptPath)}";
import { FrugalConfig } from "${resolveFrugal("../Config.ts", serverScriptPath)}";
import { ${cacheStorageInstance.import.name} as CacheStorage } from "${
                resolveFrugal(cacheStorageInstance.import.url, serverScriptPath)
            }";
            
import userConfig from "${resolveFrugal(this.#config.self, serverScriptPath)}"
import * as manifest from "../${manifestName}"

const deploymentId = "${dateFormater.format(now)}-${timeFormAter.format(now)}";

console.log('deployment id', deploymentId)

const config = new FrugalConfig(userConfig)

const cacheStorage = new CacheStorage(${
                cacheStorageInstance.instanceParams("config", "manifest", "deploymentId").join(", ")
            })
const cache = new RuntimeStorageCache(cacheStorage)

const router = new Router({ config, manifest, cache })

const current = await cacheStorage.get("__frugal__current")
if (current !== deploymentId) {
    console.log('populate')
    const { populate } = await import("./populate.mjs")
    await populate(cacheStorage, deploymentId)
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

function resolveFrugal(_path: string, script: string) {
    const url = new URL(_path, import.meta.url);
    if (url.protocol === "file:") {
        return path.relative(path.dirname(script), path.fromFileUrl(url));
    }
    return new URL("../page/Router.ts", import.meta.url).href;
}
