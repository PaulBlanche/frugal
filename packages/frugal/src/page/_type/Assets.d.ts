export type AssetType =
    | { type: "global"; asset: any }
    | { type: "page"; assets: Record<string, any> };

export type AssetRepository = Record<string, AssetType[]>;
