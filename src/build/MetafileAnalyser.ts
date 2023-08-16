import * as importmap from "../../dep/importmap.ts";
import * as xxhash from "../../dep/xxhash.ts";
import * as esbuild from "../../dep/esbuild.ts";

import { FrugalConfig } from "../Config.ts";

type MetaFileOutput = esbuild.Metafile["outputs"][string];

type Analysis = {
    type: "page";
    entrypoint: string;
    outputPath: string;
    moduleHash: string;
} | {
    type: "config";
    moduleHash: string;
};

export class MetaFileAnalyser {
    #config: FrugalConfig;
    #metafile: esbuild.Metafile;

    constructor(config: FrugalConfig, metafile: esbuild.Metafile) {
        this.#config = config;
        this.#metafile = metafile;
    }

    async analyseOutput(outputPath: string, output: MetaFileOutput) {
        if (!output.entryPoint) {
            return undefined;
        }

        const entryPointUrl = new URL(output.entryPoint, this.#config.self);
        const page = this.#config.pages.find((page) => page.href === entryPointUrl.href);

        if (page === undefined) {
            // compare pathname and not href because the url might include a
            // cache busting hash (for the watch process)
            if (entryPointUrl.pathname === this.#config.self.pathname) {
                return await this.#handleConfig(output.entryPoint);
            }
            if (entryPointUrl.pathname.endsWith(".css")) {
                return await this.#handleCss(output.entryPoint);
            }
            throw Error(`Found esbuild entrypoint ${output.entryPoint} that is not a page`);
        }

        return await this.#handlePage(output.entryPoint, outputPath);
    }

    async #handlePage(entrypoint: string, outputPath: string): Promise<Analysis> {
        return {
            type: "page",
            entrypoint,
            outputPath,
            moduleHash: await this.#moduleHash(entrypoint),
        };
    }

    async #handleCss(entrypoint: string): Promise<Analysis> {
        return {
            type: "config",
            moduleHash: await this.#moduleHash(entrypoint),
        };
    }

    async #handleConfig(entrypoint: string): Promise<Analysis> {
        return {
            type: "config",
            moduleHash: await this.#moduleHash(entrypoint),
        };
    }

    async #moduleHash(entrypoint: string) {
        const importMap = await this.#config.importMap;

        const dependencies = [];
        dependencies.push({
            path: entrypoint,
            url: new URL(entrypoint, this.#config.self),
        });

        const seen = new Set();
        const queue = [
            ...dependencies,
        ];

        let current = undefined;
        while ((current = queue.pop()) !== undefined) {
            if (seen.has(current.path)) {
                continue;
            }
            seen.add(current.path);

            const input = this.#metafile.inputs[current.path];
            for (const imported of input.imports) {
                if (imported.external || !imported.original) {
                    continue;
                }

                const parsed = parsePath(imported.path);

                const resolved = importMap
                    ? new URL(importmap.resolveModuleSpecifier(parsed.path, importMap, this.#config.rootdir))
                    : new URL(parsed.path, this.#config.rootdir);
                const dep = {
                    path: imported.path,
                    url: resolved,
                };
                dependencies.push(dep);
                queue.push(dep);
            }
        }

        const hash = await xxhash.create();
        for (const dep of dependencies) {
            hash.update(await getDependencyContent(dep, this.#config));
        }

        return hash.digest("hex").toString();
    }
}

const ENCODER = new TextEncoder();

async function getDependencyContent(dep: { path: string; url: URL }, config: FrugalConfig) {
    if (dep.url.protocol === "file:") {
        return await Deno.readFile(new URL(dep.url, config.rootdir));
    }
    if (dep.url.protocol === "frugal-config:") {
        const contentUrl = new URL(dep.url, config.rootdir);
        return await Deno.readFile(contentUrl.pathname);
    }
    return ENCODER.encode(dep.url.href);
}
function parsePath(importPath: string) {
    try {
        const url = new URL(importPath);
        return {
            namespace: url.protocol,
            path: importPath,
        };
    } catch {
        return {
            path: `./${importPath}`,
        };
    }
}
