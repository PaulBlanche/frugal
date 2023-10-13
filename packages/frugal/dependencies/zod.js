export * from "./_type/zod.js";

/** @type {import("./zod/node.js")} */
let IMPLEMENTATION;

if (typeof Deno !== "undefined") {
    IMPLEMENTATION = await import("./zod/deno.js");
} else {
    IMPLEMENTATION = await import("./zod/node.js");
}

export const object = IMPLEMENTATION.object;
export const string = IMPLEMENTATION.string;
export const tuple = IMPLEMENTATION.tuple;
export const any = IMPLEMENTATION.any;
const func = IMPLEMENTATION.function;
export const literal = IMPLEMENTATION.literal;
export const optional = IMPLEMENTATION.optional;
export const boolean = IMPLEMENTATION.boolean;
export const ZodError = IMPLEMENTATION.ZodError;

export { func as function };
