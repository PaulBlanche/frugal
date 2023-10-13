import * as sessionStorage from "./SessionStorage.js";

/** @implements {sessionStorage.SessionStorage} */
export class MemorySessionStorage {
    /** @type {Map<string, { data: sessionStorage.SessionData; expires: number | undefined }>} */
    #store;

    constructor() {
        this.#store = new Map();
    }

    /**
     * @param {Headers} _headers
     * @param {sessionStorage.SessionData} data
     * @param {number} [expires]
     * @returns
     */
    create(_headers, data, expires) {
        const id = crypto.randomUUID();

        this.#store.set(id, { data, expires });

        return id;
    }

    /**
     * @param {Headers} _headers
     * @param {string} id
     * @returns
     */
    get(_headers, id) {
        const stored = this.#store.get(id);

        if (stored === undefined) {
            return undefined;
        }

        if (stored.expires && stored.expires < Date.now()) {
            this.#store.delete(id);
            return undefined;
        }

        return stored.data;
    }

    /**
     * @param {Headers} _headers
     * @param {string} id
     * @param {sessionStorage.SessionData} data
     * @param {number} [expires]
     */
    update(_headers, id, data, expires) {
        this.#store.set(id, { data, expires });
    }

    /**
     * @param {Headers} _headers
     * @param {string} id
     */
    delete(_headers, id) {
        this.#store.delete(id);
    }
}
