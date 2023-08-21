import * as path from "../dep/std/path.ts";
import * as xxhash from "../dep/xxhash.ts";
import * as streams from "../dep/std/streams.ts";

import { FrugalConfig } from "./Config.ts";
import { PageDescriptor } from "./page/PageDescriptor.ts";
import { AssetRepository } from "./page/Assets.ts";

export type Manifest = {
    id: string;
    config: string;
    assets: AssetRepository;
    pages: { moduleHash: string; entrypoint: string; descriptor: PageDescriptor }[];
};

export type WritableManifest = {
    config: string;
    id: string;
    assets: AssetRepository;
    pages: { moduleHash: string; entrypoint: string; outputPath: string }[];
};

class ManifestExecutionError extends Error {}

export async function loadManifest(config: FrugalConfig): Promise<Manifest> {
    const manifestName = await getManifestName(config);
    if (manifestName === undefined) {
        throw Error("No manifest was built");
    }
    const filePath = path.resolve(config.outdir, manifestName);

    try {
        return await import(filePath);
    } catch (error) {
        throw new ManifestExecutionError(`Error while loading manifest ${filePath}: ${error.message}`, {
            cause: error,
        });
    }
}

export async function writeManifest(config: FrugalConfig, manifest: WritableManifest) {
    const content = manifestContent(config, manifest);
    const hash = (await xxhash.create()).update(content).digest("hex").toString();

    const manifestName = `manifest-${hash}.mjs`;
    await setManifestName(config, manifestName);

    const filePath = path.resolve(config.outdir, manifestName);
    try {
        const file = await Deno.open(filePath, { write: true, createNew: true });
        try {
            await streams.writeAll(file, new TextEncoder().encode(content));
        } finally {
            file.close();
        }
    } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
            throw error;
        }
    }
}

export async function getManifestName(config: FrugalConfig) {
    const manifestNamePath = path.resolve(config.outdir, "manifestname");
    try {
        return await Deno.readTextFile(manifestNamePath);
    } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
        }
    }
}

async function setManifestName(config: FrugalConfig, name: string) {
    const manifestNamePath = path.resolve(config.outdir, "manifestname");
    await Deno.writeTextFile(manifestNamePath, name);
}

function manifestContent(config: FrugalConfig, manifest: WritableManifest) {
    return `${
        manifest.pages.map((page) => {
            const pagePath = path.resolve(config.rootdir, page.outputPath);
            const importIdentifier = `./${path.relative(config.outdir, pagePath)}`;
            return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}";`;
        }).join("\n")
    }

export const id = ${JSON.stringify(manifest.id)};
export const config = ${JSON.stringify(manifest.config)};
export const assets = ${JSON.stringify(manifest.assets)};
export const pages = [${
        manifest.pages.map((page) =>
            `{
    "moduleHash": "${page.moduleHash}",
    "entrypoint": "${page.entrypoint}",
    "descriptor": descriptor_${page.moduleHash},
}`
        ).join(",\n")
    }];
`;
}
