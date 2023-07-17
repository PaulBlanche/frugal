import { FrugalConfig } from "../Config.ts";
import { BuildCacheSnapshot } from "../cache/BuildCacheSnapshot.ts";

export type ExportContext = {
    config: FrugalConfig;
    snapshot: BuildCacheSnapshot;
};

export type Export = (context: ExportContext) => Promise<void>;
