import * as esbuild from "../dep/esbuild.ts";
import type { FrugalConfig } from "./Config.ts";

export type Asset = {
    entrypoint: string;
    url: URL;
};

type OutputEntryPoint =
    & Omit<esbuild.Metafile["outputs"][string], "entryPoint">
    & {
        entryPoint: string;
        path: string;
    };

export class AssetCollector {
    #metafile: esbuild.Metafile;
    #config: FrugalConfig;

    constructor(config: FrugalConfig, metafile: esbuild.Metafile) {
        this.#metafile = metafile;
        this.#config = config;
    }

    collect(filter: RegExp) {
        const assets: Asset[] = [];

        const inputs = this.#metafile.inputs;

        const outputEntryPoints = this.#getOutputEntryPoints();

        for (const outputEntryPoint of outputEntryPoints) {
            const visited = new Set();
            const queue = [outputEntryPoint.entryPoint];
            let current: string | undefined = undefined;
            while ((current = queue.pop()) !== undefined) {
                if (visited.has(current)) {
                    continue;
                }
                visited.add(current);

                if (filter.test(current)) {
                    const url = new URL(current, this.#config.self);
                    if (url.protocol !== "facade:") {
                        assets.push({
                            entrypoint: outputEntryPoint.entryPoint,
                            url: new URL(current, this.#config.self),
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

    #getOutputEntryPoints(): OutputEntryPoint[] {
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
