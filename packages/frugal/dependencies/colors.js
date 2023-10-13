/** @type {import("./colors/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./colors/deno.js");
} else {
    IMPLEMENTATION = await import("./colors/node.js");
}

export const grey = IMPLEMENTATION.grey;
export const yellow = IMPLEMENTATION.yellow;
export const brightRed = IMPLEMENTATION.brightRed;
export const bold = IMPLEMENTATION.bold;
export const red = IMPLEMENTATION.red;
export const bgGray = IMPLEMENTATION.bgGray;
export const brightWhite = IMPLEMENTATION.brightWhite;
export const bgBrightWhite = IMPLEMENTATION.bgBrightWhite;
export const brightYellow = IMPLEMENTATION.brightYellow;
export const bgBrightYellow = IMPLEMENTATION.bgBrightYellow;
export const bgBrightRed = IMPLEMENTATION.bgBrightRed;
export const blue = IMPLEMENTATION.blue;
export const black = IMPLEMENTATION.black;
