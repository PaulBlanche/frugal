import * as fs from "../../dependencies/fs.js";
import * as path from "../../dependencies/path.js";

import { log } from "../log.js";
import * as exporter from "./Exporter.js";
import { FrugalConfig } from "../Config.js";
import * as buildCacheSnapshot from "../cache/BuildCacheSnapshot.js";

/** @implements {exporter.Exporter} */
export class NginxExporter {
    constructor() {}

    /**
     * @param {exporter.ExportContext} context
     * @returns
     */
    export(context) {
        return new InternalExporter(context).export();
    }
}

class InternalExporter {
    /** @type {buildCacheSnapshot.BuildCacheSnapshot} */
    #snapshot;
    /** @type {FrugalConfig} */
    #config;

    /** @param {exporter.ExportContext} param0 */
    constructor({ snapshot, config }) {
        this.#snapshot = snapshot;
        this.#config = config;
    }

    async export() {
        log("Exporting website for nginx", { scope: "NginxExporter", level: "info" });
        log("Only static pages will be exported", { scope: "NginxExporter", level: "warning" });

        await this.#write();
    }

    async #write() {
        await Promise.all(
            this.#snapshot.added.map(async (response) => {
                if (response.documentPath === undefined) {
                    log(`Skip exporting response "${response.path}" with empty body`, {
                        scope: "NginxExporter",
                        level: "warning",
                    });
                    return;
                }
                if (response.headers.length !== 0 || response.status !== undefined) {
                    log(
                        `Custom headers/status on response "${response.path}" are ignored during export`,
                        {
                            scope: "NginxExporter",
                            level: "warning",
                        },
                    );
                }
                log(`Export write "${response.path}" (${response.hash})`, {
                    scope: "NginxExporter",
                    level: "debug",
                });
                const filePath = path.resolve(
                    this.#config.publicdir,
                    `.${response.path}/index.html`,
                );
                await fs.ensureFile(filePath);
                await fs.copy(
                    path.resolve(path.dirname(this.#config.buildCacheFile), response.documentPath),
                    filePath,
                    {
                        overwrite: true,
                    },
                );
            }),
        );

        await Promise.all(
            this.#snapshot.evicted.map(async (response) => {
                log(`Export remove "${response.path}" (${response.hash})`, {
                    scope: "NginxExporter",
                    level: "debug",
                });
                const filePath = path.resolve(
                    this.#config.publicdir,
                    `.${response.path}/index.html`,
                );
                try {
                    await this.#clean(filePath);
                } catch (/** @type {any} */ error) {
                    if (!(error instanceof fs.errors.NotFound)) {
                        throw error;
                    }
                }
            }),
        );
    }

    /** @param {string} filePath */
    async #clean(filePath) {
        const publicPath = this.#config.publicdir;

        let current = filePath;
        while (current !== publicPath) {
            const currentStat = await fs.stat(current);
            if (currentStat.isDirectory()) {
                const items = [];
                const directory = await fs.readDir(current);
                for await (const dirEntry of directory) {
                    items.push(dirEntry);
                }
                if (items.length === 0) {
                    await fs.remove(current);
                    current = path.dirname(current);
                } else {
                    break;
                }
            } else {
                await fs.remove(current);
                current = path.dirname(current);
            }
        }
    }
}
