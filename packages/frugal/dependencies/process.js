import * as _type from "./_type/process.js";
export * from "./_type/process.js";

/** @type {import("./process/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./process/deno.js");
} else {
    IMPLEMENTATION = await import("./process/node.js");
}

export const exit = IMPLEMENTATION.exit;
export const addSignalListener = IMPLEMENTATION.addSignalListener;
export const env = IMPLEMENTATION.env;
export const args = IMPLEMENTATION.args;
export const mainModule = IMPLEMENTATION.mainModule;
export const cwd = IMPLEMENTATION.cwd;
export const execPath = IMPLEMENTATION.execPath;
export const spawn = IMPLEMENTATION.spawn;
