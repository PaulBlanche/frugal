import * as _type from "./_type/path-to-regexp.js";
export * from "./_type/path-to-regexp.js";

/** @type {import("./path-to-regexp/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./path-to-regexp/deno.js");
} else {
    IMPLEMENTATION = await import("./path-to-regexp/node.js");
}

export const compile = IMPLEMENTATION.compile;
export const match = IMPLEMENTATION.match;
