import { SerializedGenerationResult } from "../../page/GenerationResult.js";

export type WatchCachEntry = SerializedGenerationResult & { updatedAt: number };
