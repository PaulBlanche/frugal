import * as _type from "./_type/deferred.js";
export * from "./_type/deferred.js";

/**
 * @template T
 * @returns {_type.Deferred<T>}
 */
export function deferred() {
    let methods;
    let state = "pending";
    const promise = new Promise((resolve, reject) => {
        methods = {
            /** @param {T | PromiseLike<T>} value */
            async resolve(value) {
                await value;
                state = "fulfilled";
                resolve(value);
            },
            /** @param {any} reason */
            reject(reason) {
                state = "rejected";
                reject(reason);
            },
        };
    });
    Object.defineProperty(promise, "state", { get: () => state });
    return Object.assign(promise, methods);
}
