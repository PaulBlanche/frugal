import * as pageSession from "../../page/PageSession.js";
import * as sessionStorage from "./SessionStorage.js";

/** @implements {pageSession.PageSession} */
export class Session {
    /** @type {Map<string, any>} */
    #data;
    /** @type {string | undefined} */
    #id;
    /** @type {boolean} */
    #shouldBePersisted;

    /**
     * @param {sessionStorage.SessionData} [data]
     * @param {string} [id]
     */
    constructor(data = {}, id) {
        this.#id = id;
        this.#data = new Map(Object.entries(data));
        this.#shouldBePersisted = false;
    }

    get _id() {
        return this.#id;
    }

    get _data() {
        return Object.fromEntries(this.#data);
    }

    get _shouldBePersisted() {
        return this.#shouldBePersisted;
    }

    persist() {
        this.#shouldBePersisted = true;
    }

    /**
     * @template [T=unknown]
     * @param {string} key
     * @returns {T | undefined}
     */
    get(key) {
        return this.#data.get(key);
    }

    /**
     * @template [T=unknown]
     * @param {string} key
     * @param {T} value
     */
    set(key, value) {
        this.#data.set(key, value);
    }

    /** @param {string} key */
    delete(key) {
        this.#data.delete(key);
    }

    /**
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return this.#data.has(key);
    }
}
