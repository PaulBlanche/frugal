export type AssetType = {
    type: "global";
    // deno-lint-ignore no-explicit-any
    asset: any;
} | {
    type: "page";
    // deno-lint-ignore no-explicit-any
    assets: Record<string, any>;
};

export type AssetRepository = Record<string, AssetType>;

export class Assets {
    #assets: AssetRepository;
    #descriptor: string;

    constructor(assets: AssetRepository, descriptor: string) {
        this.#assets = assets;
        this.#descriptor = descriptor;
    }

    get(type: string) {
        if (!(type in this.#assets)) {
            throw Error(`No "${type}" assets found`);
        }
        const assetType = this.#assets[type];
        if (assetType.type === "global") {
            return assetType.asset;
        }
        if (assetType.type === "page") {
            if (!(this.#descriptor in assetType.assets)) {
                throw Error(`No "${type}" assets found for page "${this.#descriptor}"`);
            }
            return assetType.assets[this.#descriptor];
        }
    }
}
