import { PageDescriptor } from "../page/PageDescriptor.js";
import { AssetRepository } from "../page/Assets.js";

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
