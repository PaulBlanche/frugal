import { FrugalConfig } from "./Config.ts";
import { Assets, PageDescriptor } from "./page/PageDescriptor.ts";

export type Manifest = {
    id: string;
    config: string;
    assets: Assets;
    pages: { moduleHash: string; entrypoint: string; descriptor: PageDescriptor }[];
};

export async function loadManifest(config: FrugalConfig, cacheBust = true): Promise<Manifest> {
    const manifestURL = new URL("manifest.mjs", config.outdir);
    if (cacheBust) {
        manifestURL.hash = String(Date.now());
    }

    try {
        return await import(manifestURL.href);
    } catch (error) {
        throw new ManifestExecutionError(`Error while loading manifest ${manifestURL.href}: ${error.message}`, {
            cause: error,
        });
    }
}

class ManifestExecutionError extends Error {}
