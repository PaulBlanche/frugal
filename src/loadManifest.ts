import { FrugalConfig } from "./Config.ts";
import { Assets, PageDescriptor } from "./page/PageDescriptor.ts";

export type LoadedManifest = {
    id: string;
    config: string;
    assets: Assets;
    pages: { moduleHash: string; entrypoint: string; descriptor: PageDescriptor }[];
};

export function getManifestURL(config: FrugalConfig) {
    return new URL("manifest.mjs", config.cachedir);
}

export async function loadManifest(config: FrugalConfig): Promise<LoadedManifest> {
    const manifestURL = getManifestURL(config);
    manifestURL.hash = String(Date.now());

    try {
        return await import(manifestURL.href);
    } catch (error) {
        throw new ManifestExecutionError(`Error while loading manifest`, { cause: error });
    }
}

class ManifestExecutionError extends Error {}
