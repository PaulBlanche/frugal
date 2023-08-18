import { CacheStorage, CacheStorageCreator } from "./CacheStorage.ts";

export class UpstashCache implements CacheStorageCreator {
    #url: string;
    #token: string;

    constructor(url: string, token: string) {
        this.#url = url;
        this.#token = token;
    }

    instance() {
        return {
            import: { name: "UpstashCacheStorage", url: import.meta.url },
            instanceParams: (
                _config: string,
                _manifest: string,
                deploymentId: string,
            ) => [`"${this.#url}"`, `"${this.#token}"`, deploymentId],
        };
    }
}

export class UpstashCacheStorage implements CacheStorage {
    #url: string;
    #token: string;
    #deploymentId: string;

    constructor(url: string, token: string, deploymentId: string) {
        this.#url = url;
        this.#token = token;
        this.#deploymentId = deploymentId;
    }

    async set(key: string, content: string) {
        const command = ["hset", this.#deploymentId, key, content];

        const response = await this.#sendCommand(command);

        if (response.status !== 200) {
            const body = await response.json();
            throw new Error(body.error);
        }
    }

    async get(key: string) {
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

    async delete(key: string) {
        const command = ["hdel", this.#deploymentId, key];

        const response = await this.#sendCommand(command);
        if (response.status !== 200) {
            const body = await response.json();
            throw new Error(body.error);
        }
    }

    async #sendCommand(command: (string | number)[]) {
        return await fetch(
            this.#url,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.#token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(command),
            },
        );
    }
}
