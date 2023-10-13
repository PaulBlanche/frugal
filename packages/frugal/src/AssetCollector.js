import * as _type from "./_type/AssetCollector.js";
export * from "./_type/AssetCollector.js";

import * as esbuild from "../dependencies/esbuild.js";
import * as path from "../dependencies/path.js";

import * as config from "./Config.js";

/** @typedef {_type.Asset} Asset */

export class AssetCollector {
    /** @type {esbuild.Metafile} */
    #metafile;
    /** @type {config.FrugalConfig} */
    #config;

    /**
     * @param {config.FrugalConfig} config
     * @param {esbuild.Metafile} metafile
     */
    constructor(config, metafile) {
        this.#metafile = metafile;
        this.#config = config;
    }

    /**
     * @param {RegExp} filter
     * @returns {_type.Asset[]}
     */
    collect(filter) {
        /** @type {Asset[]} */
        const assets = [];

        const inputs = this.#metafile.inputs;

        const outputEntryPoints = this.#getOutputEntryPoints();

        for (const outputEntryPoint of outputEntryPoints) {
            const visited = new Set();
            const queue = [outputEntryPoint.entryPoint];
            /** @type {string | undefined} */
            let current = undefined;
            while ((current = queue.pop()) !== undefined) {
                if (visited.has(current)) {
                    continue;
                }
                visited.add(current);

                if (filter.test(current)) {
                    const currentURL = new URL(current, path.toFileURL(this.#config.self));
                    if (currentURL.protocol !== "facade:") {
                        assets.push({
                            entrypoint: outputEntryPoint.entryPoint,
                            path: path.fromFileURL(currentURL),
                        });
                    }
                }

                const input = inputs[current];

                const imports = input.imports;
                for (const imported of imports) {
                    if (imported.external) {
                        continue;
                    }

                    queue.push(imported.path);
                }
            }
        }

        return assets.reverse();
    }

    /** @returns {_type.OutputEntryPoint[]} */
    #getOutputEntryPoints() {
        const outputs = this.#metafile.outputs;

        const outputEntryPoints = [];

        for (const [outputPath, output] of Object.entries(outputs)) {
            const entryPoint = output.entryPoint;
            if (entryPoint === undefined) {
                continue;
            }

            outputEntryPoints.push({ ...output, entryPoint, path: outputPath });
        }

        return outputEntryPoints;
    }
}
