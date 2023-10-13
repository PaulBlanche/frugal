import * as _type from "./_type/Assets.js";
export * from "./_type/Assets.js";

export class Assets {
    /** @type {_type.AssetRepository} */
    #assets;
    /** @type {string} */
    #descriptor;

    /**
     * @param {_type.AssetRepository} assets
     * @param {string} descriptor
     */
    constructor(assets, descriptor) {
        this.#assets = assets;
        this.#descriptor = descriptor;
    }

    /**
     * @param {string} type
     * @returns {_type.AssetType[]}
     */
    get(type) {
        if (!(type in this.#assets)) {
            throw Error(`No "${type}" assets found`);
        }
        const assetTypes = this.#assets[type];
        return assetTypes.map((assetType) => {
            if (assetType.type === "global") {
                return assetType.asset;
            }
            if (assetType.type === "page") {
                if (!(this.#descriptor in assetType.assets)) {
                    throw Error(`No "${type}" assets found for page "${this.#descriptor}"`);
                }
                return assetType.assets[this.#descriptor];
            }
        });
    }
}
