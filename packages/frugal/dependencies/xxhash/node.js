import * as _type from "../_type/xxhash.js";

import * as xxhash from "@node-rs/xxhash";

/** @implements {_type.Hasher} */
class Hasher {
    /** @type {xxhash.Xxh64} */
    #hasher;

    /** @param {xxhash.Xxh64} hasher */
    constructor(hasher) {
        this.#hasher = hasher;
    }

    /**
     * @param {Uint8Array | string} data
     * @returns {Hasher}
     */
    update(data) {
        this.#hasher.update(typeof data === "string" ? data : Buffer.from(data));
        return this;
    }

    /** @returns {string} */
    digest() {
        return this.#hasher.digest().toString(36);
    }
}

/** @returns {Promise<_type.Hasher>} */
export function create() {
    return Promise.resolve(new Hasher(new xxhash.Xxh64()));
}
