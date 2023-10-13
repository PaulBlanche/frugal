import * as _type from "./_type/MetafileAnalyser.js";
export * from "./_type/MetafileAnalyser.js";

import * as esbuild from "../../dependencies/esbuild.js";
import * as path from "../../dependencies/path.js";
import * as fs from "../../dependencies/fs.js";
import * as xxhash from "../../dependencies/xxhash.js";

import { FrugalConfig } from "../Config.js";

export class MetaFileAnalyser {
    /** @type {FrugalConfig} */
    #config;
    /** @type {esbuild.Metafile} */
    #metafile;

    /**
     * @param {FrugalConfig} config
     * @param {esbuild.Metafile} metafile
     */
    constructor(config, metafile) {
        this.#config = config;
        this.#metafile = metafile;
    }

    /**
     * @param {string} outputPath
     * @param {_type.MetaFileOutput} output
     * @returns
     */
    async analyseOutput(outputPath, output) {
        if (!output.entryPoint) {
            return undefined;
        }

        const entryPointPath = path.resolve(this.#config.rootdir, output.entryPoint);
        const page = this.#config.pages.find((page) => page === entryPointPath);

        if (page === undefined) {
            if (entryPointPath === this.#config.self) {
                return await this.#handleConfig(output.entryPoint);
            }
            if (entryPointPath.endsWith(".css")) {
                return await this.#handleCss(output.entryPoint);
            }
        } else {
            return await this.#handlePage(output.entryPoint, outputPath);
        }
    }

    /**
     * @param {string} entrypoint
     * @param {string} outputPath
     * @returns {Promise<_type.Analysis>}
     */
    async #handlePage(entrypoint, outputPath) {
        return {
            type: "page",
            entrypoint,
            outputPath,
            moduleHash: await this.#moduleHash(entrypoint),
        };
    }

    /**
     * @param {string} entrypoint
     * @returns {Promise<_type.Analysis>}
     */
    async #handleCss(entrypoint) {
        return {
            type: "config",
            moduleHash: await this.#moduleHash(entrypoint),
        };
    }

    /**
     * @param {string} entrypoint
     * @returns {Promise<_type.Analysis>}
     */
    async #handleConfig(entrypoint) {
        return {
            type: "config",
            moduleHash: await this.#moduleHash(entrypoint),
        };
    }

    /**
     * @param {string} entrypoint
     * @returns
     */
    async #moduleHash(entrypoint) {
        const dependencies = [];
        dependencies.push({
            input: entrypoint,
            namespace: "file:",
            path: path.resolve(this.#config.rootdir, entrypoint),
        });

        const seen = new Set();
        const queue = [...dependencies];

        let current = undefined;
        while ((current = queue.pop()) !== undefined) {
            if (seen.has(current.input)) {
                continue;
            }
            seen.add(current.input);

            const input = this.#metafile.inputs[current.input];
            for (const imported of input.imports) {
                if (imported.external || !imported.original) {
                    continue;
                }

                const parsed = parsePath(imported.path);

                const dep = {
                    input: imported.path,
                    namespace: parsed.namespace,
                    path:
                        parsed.namespace === "file:"
                            ? path.resolve(this.#config.rootdir, parsed.path)
                            : parsed.path,
                };
                dependencies.push(dep);
                queue.push(dep);
            }
        }

        const hasher = await xxhash.create();
        for (const dep of dependencies) {
            hasher.update(await getDependencyContent(dep));
        }
        return hasher.digest();
    }
}

const ENCODER = new TextEncoder();

/**
 * @param {{ namespace: string; path: string }} dep
 * @returns
 */
async function getDependencyContent(dep) {
    if (dep.namespace === "file:") {
        return await fs.readFile(dep.path);
    }
    if (dep.namespace === "frugal-config:") {
        return await fs.readFile(dep.path);
    }
    return ENCODER.encode(`${dep.namespace}//${dep.path}`);
}

/**
 * @param {string} importPath
 * @returns
 */
function parsePath(importPath) {
    try {
        const url = new URL(importPath);
        return {
            namespace: url.protocol,
            path: url.pathname,
        };
    } catch {
        return {
            namespace: "file:",
            path: importPath,
        };
    }
}
