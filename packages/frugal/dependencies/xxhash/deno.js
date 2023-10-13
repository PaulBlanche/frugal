import * as _type from "../_type/xxhash.js";

import * as xxhash from "../_dep/xxhash.js";

/** @implements {_type.Hasher} */
class Hasher {
    /** @type {xxhash.Hasher} */
    #hasher;

    /** @param {xxhash.Hasher} hasher */
    constructor(hasher) {
        this.#hasher = hasher;
    }

    /**
     * @param {Uint8Array | string} data
     * @returns {Hasher}
     */
    update(data) {
        this.#hasher.update(data);
        return this;
    }

    /** @returns {string} */
    digest() {
        return this.#hasher.digest("bigint").toString(36);
    }
}

/** @returns {Promise<_type.Hasher>} */
export async function create() {
    return new Hasher(await xxhash.create());
}
