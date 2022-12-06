import * as fs from '../../dep/std/fs.ts';
import * as pathUtils from '../../dep/std/path.ts';
import { FrugalError } from './FrugalError.ts';

export class NotFound extends FrugalError {}

/**
 * A persistence layer
 */
export interface Persistence {
    /**
     * Set the given content at the given path
     */
    set(path: string, content: string): Promise<void>;
    /**
     * Get the content at the given path in a string
     */
    get(path: string): Promise<string>;
    /**
     * delete the content at the given path
     */
    delete(path: string): Promise<void>;
}

/**
 * A persistence layer using the filesystem
 */
export class FilesystemPersistence implements Persistence {
    constructor() {}

    async set(path: string, content: string) {
        await fs.ensureFile(path);
        return await Deno.writeTextFile(path, content);
    }

    async get(path: string) {
        try {
            return await Deno.readTextFile(path);
        } catch (error: unknown) {
            if (error instanceof Deno.errors.NotFound) {
                throw new NotFound(`path ${path} was not found`);
            }
            throw error;
        }
    }

    async delete(path: string) {
        return await Deno.remove(path);
    }
}

/**
 * A persistence layer using Upstash
 */
export class UpstashPersistence implements Persistence {
    #url: string;
    #token: string;
    #namespace: string;
    #root: string;

    constructor(url: string, token: string, namespace: string, root: string) {
        this.#url = url;
        this.#token = token;
        this.#namespace = namespace;
        this.#root = root;
    }

    async #sendCommand(command: unknown) {
        return await fetch(
            this.#url,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.#token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(command),
            },
        );
    }

    #key(path: string) {
        return `${this.#namespace}:${pathUtils.relative(this.#root, path)}`;
    }

    async set(path: string, content: string) {
        const response = await this.#sendCommand([
            'set',
            this.#key(path),
            content,
        ]);
        if (response.status !== 200) {
            const body = await response.json();
            throw new Error(body.error);
        }
    }

    async get(path: string) {
        const response = await this.#sendCommand(['get', this.#key(path)]);
        const body = await response.json();
        if (response.status !== 200) {
            throw new Error(body.error);
        }
        if (body.result === null) {
            throw new NotFound(`path ${path} was not found`);
        }
        return body.result;
    }

    async delete(path: string) {
        const response = await this.#sendCommand(['del', this.#key(path)]);
        if (response.status !== 200) {
            const body = await response.json();
            throw new Error(body.error);
        }
    }
}
