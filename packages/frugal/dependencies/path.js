/** @type {import("./path/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./path/deno.js");
} else {
    IMPLEMENTATION = await import("./path/node.js");
}

export const dirname = IMPLEMENTATION.dirname;
export const join = IMPLEMENTATION.join;
export const basename = IMPLEMENTATION.basename;
export const extname = IMPLEMENTATION.extname;
export const normalize = IMPLEMENTATION.normalize;
export const fromFileURL = IMPLEMENTATION.fromFileURL;
export const toFileURL = IMPLEMENTATION.toFileURL;
export const resolve = IMPLEMENTATION.resolve;
export const relative = IMPLEMENTATION.relative;
export const common = IMPLEMENTATION.common;
export const isAbsolute = IMPLEMENTATION.isAbsolute;
export const SEP = IMPLEMENTATION.SEP;
