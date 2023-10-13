/** @type {import("./es-lexer/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./es-lexer/deno.js");
} else {
    IMPLEMENTATION = await import("./es-lexer/node.js");
}

export const parse = IMPLEMENTATION.parse;
