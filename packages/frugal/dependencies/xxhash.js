import * as _type from "./_type/xxhash.js";
export * from "./_type/xxhash.js";

/** @type {import("./xxhash/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./xxhash/deno.js");
} else {
    IMPLEMENTATION = await import("./xxhash/node.js");
}

export const create = IMPLEMENTATION.create;
