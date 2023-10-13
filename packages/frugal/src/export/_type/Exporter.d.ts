import { FrugalConfig } from "../../Config.js";
import { BuildCacheSnapshot } from "../../cache/BuildCacheSnapshot.js";

export type ExportContext = {
    config: FrugalConfig;
    snapshot: BuildCacheSnapshot;
};

export interface Exporter {
    export(context: ExportContext): Promise<void>;
    platform?: "node" | "deno";
}
