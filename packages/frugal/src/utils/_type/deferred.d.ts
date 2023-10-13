export interface Deferred<T> extends Promise<T> {
    readonly state: "pending" | "fulfilled" | "rejected";
    resolve(value?: T | PromiseLike<T>): void;
    reject(reason?: any): void;
}
