export * from "./_type/esbuild.js";

/** @type {import("./esbuild/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./esbuild/deno.js");
} else {
    IMPLEMENTATION = await import("./esbuild/node.js");
}

export const build = IMPLEMENTATION.build;
export const context = IMPLEMENTATION.context;
export const stop = IMPLEMENTATION.stop;
export const formatMessages = IMPLEMENTATION.formatMessages;
