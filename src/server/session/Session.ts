import { PageSession } from "../../page/PageSession.ts";
import { SessionData } from "./SessionStorage.ts";

export class Session implements PageSession {
    // deno-lint-ignore no-explicit-any
    #data: Map<string, any>;
    #id: string | undefined;
    #shouldBePersisted: boolean;

    constructor(data: SessionData = {}, id?: string) {
        this.#id = id;
        this.#data = new Map(
            Object.entries(data),
        );
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

    get<T = unknown>(key: string): T | undefined {
        return this.#data.get(key);
    }

    set<T = unknown>(key: string, value: T): void {
        this.#data.set(key, value);
    }

    delete(key: string): void {
        this.#data.delete(key);
    }

    has(key: string): boolean {
        return this.#data.has(key);
    }
}
