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
    pages: { moduleHash: string; entrypoint: string; descriptor: PageDescriptor; route?: string }[];
};

export type WritableManifest = {
    config: string;
    id: string;
    assets: AssetRepository;
    pages: { moduleHash: string; entrypoint: string; outputPath: string; route?: string }[];
};

class ManifestExecutionError extends Error {}

export async function loadManifest(config: FrugalConfig): Promise<Manifest> {
    const name = await getManifestName(config);
    if (name === undefined) {
        throw Error("No manifest was built");
    }
    const manifestURL = new URL(name, config.outdir);

    try {
        return await import(manifestURL.href);
    } catch (error) {
        throw new ManifestExecutionError(`Error while loading manifest ${manifestURL.href}: ${error.message}`, {
            cause: error,
        });
    }
}

export async function writeManifest(config: FrugalConfig, manifest: WritableManifest) {
    const content = manifestContent(config, manifest);
    const hash = (await xxhash.create()).update(content).digest("hex").toString();

    const manifestName = `manifest-${hash}.mjs`;
    await setManifestName(config, manifestName);

    const filePath = path.resolve(path.fromFileUrl(config.outdir), manifestName);
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
    const manifestNameURL = new URL("manifestname", config.outdir);
    try {
        return await Deno.readTextFile(manifestNameURL);
    } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
        }
    }
}

async function setManifestName(config: FrugalConfig, name: string) {
    const manifestNameURL = new URL("manifestname", config.outdir);
    await Deno.writeTextFile(manifestNameURL, name);
}

function manifestContent(config: FrugalConfig, manifest: WritableManifest) {
    return `${
        manifest.pages.map((page) => {
            const url = new URL(page.outputPath, config.rootdir);
            const importIdentifier = `./${path.relative(path.fromFileUrl(config.outdir), path.fromFileUrl(url))}`;
            return `import * as descriptor_${page.moduleHash} from "./${importIdentifier}";`;
        }).join("\n")
    }

export const id = ${JSON.stringify(manifest.id)};
export const config = ${JSON.stringify(manifest.config)};
export const assets = ${JSON.stringify(manifest.assets)};
export const pages = [${
        manifest.pages.map((page) =>
            `{
    "route": ${page.route ? `"${page.route}"` : `undefined`},
    "moduleHash": "${page.moduleHash}",
    "entrypoint": "${page.entrypoint}",
    "descriptor": descriptor_${page.moduleHash},
}`
        ).join(",\n")
    }];
`;
}
