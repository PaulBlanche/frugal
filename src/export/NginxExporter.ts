import * as fs from "../../dep/std/fs.ts";
import * as path from "../../dep/std/path.ts";

import { log } from "../log.ts";
import { ExportContext, Exporter } from "./Export.ts";
import { FrugalConfig } from "../Config.ts";
import { BuildCacheSnapshot } from "../cache/BuildCacheSnapshot.ts";

export class NginxExporter implements Exporter {
    constructor() {
    }

    export(context: ExportContext) {
        return new InternalExporter(context).export();
    }
}

class InternalExporter {
    #snapshot: BuildCacheSnapshot;
    #config: FrugalConfig;

    constructor({ snapshot, config }: ExportContext) {
        this.#snapshot = snapshot;
        this.#config = config;
    }

    async export() {
        log("Exporting website for nginx", { scope: "NginxExporter", level: "info" });
        log("Only static pages will be exported", { scope: "NginxExporter", level: "warning" });

        await this.#write();
    }

    async #write() {
        await Promise.all(this.#snapshot.added.map(async (response) => {
            if (response.documentPath === undefined) {
                log(`Skip exporting response "${response.path}" with empty body`, {
                    scope: "NginxExporter",
                    level: "warning",
                });
                return;
            }
            if (response.headers.length !== 0 || response.status !== undefined) {
                log(`Custom headers/status on response "${response.path}" are ignored during export`, {
                    scope: "NginxExporter",
                    level: "warning",
                });
            }
            log(`Export write "${response.path}" (${response.hash})`, {
                scope: "NginxExporter",
                level: "debug",
            });
            const fileUrl = new URL(`.${response.path}/index.html`, this.#config.publicdir);
            await fs.ensureFile(fileUrl);
            await fs.copy(new URL(response.documentPath, this.#config.buildCacheFile), fileUrl, { overwrite: true });
        }));

        await Promise.all(this.#snapshot.evicted.map(async (response) => {
            log(`Export remove "${response.path}" (${response.hash})`, {
                scope: "NginxExporter",
                level: "debug",
            });
            const fileUrl = new URL(`.${response.path}/index.html`, this.#config.publicdir);
            try {
                await this.#clean(fileUrl);
            } catch (error) {
                if (error instanceof Deno.errors.NotFound) {
                    // do nothing, swallow error, yum
                } else {
                    throw error;
                }
            }
        }));
    }

    async #clean(url: URL) {
        const publicPath = path.fromFileUrl(this.#config.publicdir);

        let current = path.fromFileUrl(url);
        while (current !== publicPath) {
            const currentStat = await Deno.stat(current);
            if (currentStat.isDirectory) {
                const items = [];
                for await (const dirEntry of Deno.readDir(current)) {
                    items.push(dirEntry);
                }
                if (items.length === 0) {
                    await Deno.remove(current);
                    current = path.dirname(current);
                } else {
                    break;
                }
            } else {
                await Deno.remove(current);
                current = path.dirname(current);
            }
        }
    }
}
