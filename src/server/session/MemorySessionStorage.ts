import { SessionData, SessionStorage } from "./SessionStorage.ts";

export class MemorySessionStorage implements SessionStorage {
    #store: Map<string, { data: SessionData; expires: number | undefined }>;

    constructor() {
        this.#store = new Map();
    }

    create(_headers: Headers, data: SessionData, expires: number | undefined) {
        const id = crypto.randomUUID();

        this.#store.set(id, { data, expires });

        return id;
    }

    get(_headers: Headers, id: string) {
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

    update(
        _headers: Headers,
        id: string,
        data: SessionData,
        expires?: number | undefined,
    ) {
        this.#store.set(id, { data, expires });
    }

    delete(_headers: Headers, id: string) {
        this.#store.delete(id);
    }
}
