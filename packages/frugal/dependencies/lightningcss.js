export * from "./_type/lightningcss.js";

/** @type {import("./lightningcss/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./lightningcss/deno.js");
} else {
    IMPLEMENTATION = await import("./lightningcss/node.js");
}

export const transform = IMPLEMENTATION.transform;
