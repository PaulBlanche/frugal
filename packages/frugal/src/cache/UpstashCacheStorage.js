import * as cacheStorage from "./CacheStorage.js";

/** @implements {cacheStorage.CacheStorageCreator} */
export class UpstashCache {
    /** @type {string} */
    #url;
    /** @type {string} */
    #token;

    /**
     * @param {string} url
     * @param {string} token
     */
    constructor(url, token) {
        this.#url = url;
        this.#token = token;
    }

    instance() {
        return {
            import: { name: "UpstashCacheStorage", url: import.meta.url },
            /**
             * @param {string} _config
             * @param {string} _manifest
             * @param {string} deploymentId
             * @returns {string[]}
             */
            instanceParams: (_config, _manifest, deploymentId) => [
                `"${this.#url}"`,
                `"${this.#token}"`,
                deploymentId,
            ],
        };
    }
}

/** @implements {cacheStorage.CacheStorage} */
export class UpstashCacheStorage {
    /** @type {string} */
    #url;
    /** @type {string} */
    #token;
    /** @type {string} */
    #deploymentId;

    /**
     * @param {string} url
     * @param {string} token
     * @param {string} deploymentId
     */
    constructor(url, token, deploymentId) {
        this.#url = url;
        this.#token = token;
        this.#deploymentId = deploymentId;
    }

    /**
     * @param {string} key
     * @param {string} content
     */
    async set(key, content) {
        const command = ["hset", this.#deploymentId, key, content];

        const response = await this.#sendCommand(command);

        if (response.status !== 200) {
            const body = await response.json();
            throw new Error(body.error);
        }
    }

    /**
     * @param {string} key
     * @returns {Promise<string | undefined>}
     */
    async get(key) {
        const command = ["hget", this.#deploymentId, key];

        const response = await this.#sendCommand(command);
        const body = await response.json();
        if (response.status !== 200) {
            throw new Error(body.error);
        }
        if (body.result !== null) {
            return body.result;
        }
    }

    /** @param {string} key */
    async delete(key) {
        const command = ["hdel", this.#deploymentId, key];

        const response = await this.#sendCommand(command);
        if (response.status !== 200) {
            const body = await response.json();
            throw new Error(body.error);
        }
    }

    /**
     * @param {(string | number)[]} command
     * @returns {Promise<Response>}
     */
    async #sendCommand(command) {
        return await fetch(this.#url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.#token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(command),
        });
    }
}
