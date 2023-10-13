export type BuildCacheEntry = {
    path: string;
    hash: string;
    documentPath?: string;
    headers: [string, string][];
    status?: number;
    age: "new" | "old";
};

export type BuildCacheData = Record<string, BuildCacheEntry>;

export type SerializedBuildCache = { current: BuildCacheData; previous: BuildCacheData };
