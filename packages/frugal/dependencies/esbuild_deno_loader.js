/** @type {import("./esbuild_deno_loader/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./esbuild_deno_loader/deno.js");
} else {
    IMPLEMENTATION = await import("./esbuild_deno_loader/node.js");
}

export const denoResolverPlugin = IMPLEMENTATION.denoResolverPlugin;
export const denoLoaderPlugin = IMPLEMENTATION.denoLoaderPlugin;
