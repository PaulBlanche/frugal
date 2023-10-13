import * as _type from "./_type/fs.js";
export * from "./_type/fs.js";

/** @type {import("./fs/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./fs/deno.js");
} else {
    IMPLEMENTATION = await import("./fs/node.js");
}

export const errors = IMPLEMENTATION.errors;
export const writeTextFile = IMPLEMENTATION.writeTextFile;
export const writeFile = IMPLEMENTATION.writeFile;
export const readTextFile = IMPLEMENTATION.readTextFile;
export const readFile = IMPLEMENTATION.readFile;
export const readDir = IMPLEMENTATION.readDir;
export const remove = IMPLEMENTATION.remove;
export const copy = IMPLEMENTATION.copy;
export const ensureFile = IMPLEMENTATION.ensureFile;
export const ensureDir = IMPLEMENTATION.ensureDir;
export const stat = IMPLEMENTATION.stat;
export const createReadableStream = IMPLEMENTATION.createReadableStream;
export const watch = IMPLEMENTATION.watch;
