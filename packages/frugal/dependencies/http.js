import * as _type from "./_type/http.js";
export * from "./_type/http.js";

/** @type {import("./http/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./http/deno.js");
} else {
    IMPLEMENTATION = await import("./http/node.js");
}

export const setCookie = IMPLEMENTATION.setCookie;
export const getCookies = IMPLEMENTATION.getCookies;
export const serve = IMPLEMENTATION.serve;
export const send = IMPLEMENTATION.send;
