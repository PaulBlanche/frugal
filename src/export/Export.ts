import { FrugalConfig } from "../Config.ts";
import { BuildCacheSnapshot } from "../cache/BuildCacheSnapshot.ts";

export type ExportContext = {
    config: FrugalConfig;
    snapshot: BuildCacheSnapshot;
};

export interface Exporter {
    export(context: ExportContext): Promise<void>;
}
