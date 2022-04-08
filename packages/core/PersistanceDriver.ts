import * as fs from '../../dep/std/fs.ts';

export class NotFound extends Error {}

export interface PersistanceDriver {
    set(path: string, content: string): Promise<void>;
    get(path: string): Promise<string>;
    delete(path: string): Promise<void>;
}

export class FilesystemPersistanceDriver implements PersistanceDriver {
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

export class UpstashPersistanceDriver implements PersistanceDriver {
    url: string;
    token: string;

    constructor(url: string, token: string) {
        this.url = url;
        this.token = token;
    }

    private async _sendCommand(command: unknown) {
        return await fetch(
            this.url,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(command),
            },
        );
    }

    async set(path: string, content: string) {
        const response = await this._sendCommand(['set', path, content]);
        if (response.status !== 200) {
            const body = await response.json();
            throw Error(body.error);
        }
    }

    async get(path: string) {
        const response = await this._sendCommand(['get', path]);
        const body = await response.json();
        if (response.status !== 200) {
            throw Error(body.error);
        }
        if (body.result === null) {
            throw new NotFound(`path ${path} was not found`);
        }
        return body.result;
    }

    async delete(path: string) {
        const response = await this._sendCommand(['del', path]);
        if (response.status !== 200) {
            const body = await response.json();
            throw Error(body.error);
        }
    }
}
