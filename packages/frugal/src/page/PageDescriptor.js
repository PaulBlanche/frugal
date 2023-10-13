import * as _type from "./_type/PageDescriptor.js";
export * from "./_type/PageDescriptor.js";

import * as zod from "../../dependencies/zod.js";

import * as jsonValue from "./JSONValue.js";

const baseDescriptorSchema = zod.object(
    {
        route: zod
            .string({
                required_error: 'A page descriptor must have a string "route"',
                invalid_type_error: 'Expected a page descriptor with "route" as a string',
            })
            .startsWith("/", 'A page descriptor route should start with a "/"'),
        render: zod.function(zod.tuple([zod.any()]), zod.any(), {
            required_error: 'A page descriptor must have a function "render"',
            invalid_type_error: 'Expected a page descriptor with "render" as a function',
        }),
        GET: zod.optional(
            zod.function(zod.tuple([zod.any()]), zod.any(), {
                invalid_type_error: 'Expected a dynamic page descriptor with "GET" as a function',
            }),
        ),
        POST: zod.optional(
            zod.function(zod.tuple([zod.any()]), zod.any(), {
                invalid_type_error: 'Expected a page descriptor with "POST" as a function',
            }),
        ),
        PUT: zod.optional(
            zod.function(zod.tuple([zod.any()]), zod.any(), {
                invalid_type_error: 'Expected a page descriptor with "PUT" as a function',
            }),
        ),
        PATCH: zod.optional(
            zod.function(zod.tuple([zod.any()]), zod.any(), {
                invalid_type_error: 'Expected a page descriptor with "PATCH" as a function',
            }),
        ),
        DELETE: zod.optional(
            zod.function(zod.tuple([zod.any()]), zod.any(), {
                invalid_type_error: 'Expected a page descriptor with "DELETE" as a function',
            }),
        ),
    },
    {
        invalid_type_error: "Expected a page descriptor object",
    },
);

/** @type {zod.Schema<_type.DynamicPageDescriptor>} */
export const dynamicDescriptorSchema = baseDescriptorSchema.extend({
    GET: zod.function(zod.tuple([zod.any()]), zod.any(), {
        required_error: 'A dynamic page descriptor must have a function "GET"',
        invalid_type_error: 'Expected a dynamic page descriptor with "GET" as a function',
    }),
    type: zod.literal("dynamic", {
        required_error: 'A page descriptor must have a string "type"',
        invalid_type_error: 'Expected a dynamic page descriptor with "type" equal to "dynamic"',
    }),
});

/** @type {zod.Schema<_type.StaticPageDescriptor>} */
export const staticDescriptorSchema = baseDescriptorSchema.extend({
    type: zod.optional(
        zod.literal("static", {
            required_error: 'A page descriptor must have a string "type"',
            invalid_type_error: 'Expected a static page descriptor with "type" equal to "static"',
        }),
    ),
    strictPaths: zod.optional(
        zod.boolean({
            invalid_type_error: 'Expected a page descriptor with "strictPaths" as a boolean',
        }),
    ),
    getPaths: zod.optional(
        zod.function(zod.tuple([zod.any()]), zod.any(), {
            invalid_type_error: 'Expected a static page descriptor with "getPaths" as a function',
        }),
    ),
    generate: zod.optional(
        zod.function(zod.tuple([zod.any()]), zod.any(), {
            invalid_type_error: 'Expected a static page descriptor with "generate" as a function',
        }),
    ),
});

/**
 * @template {string} PATH
 * @template {jsonValue.JSONValue} DATA
 * @param {_type.PageDescriptor<PATH, DATA>} descriptor
 * @returns {descriptor is _type.StaticPageDescriptor<PATH, DATA>}
 */
export function parseStaticDescriptor(descriptor) {
    try {
        staticDescriptorSchema.parse(descriptor);
        return true;
    } catch (error) {
        if (error instanceof zod.ZodError) {
            throw new Error(error.errors[0].message);
        }
        throw error;
    }
}

/**
 * @template {string} PATH
 * @template {jsonValue.JSONValue} DATA
 * @param {_type.PageDescriptor<PATH, DATA>} descriptor
 * @returns {descriptor is _type.DynamicPageDescriptor<PATH, DATA>}
 */
export function parseDynamicDescriptor(descriptor) {
    try {
        dynamicDescriptorSchema.parse(descriptor);
        return true;
    } catch (error) {
        if (error instanceof zod.ZodError) {
            throw new Error(error.errors[0].message);
        }
        throw error;
    }
}
