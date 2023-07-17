import { JSONValue } from "./JSONValue.ts";
import { PathObject } from "./PathObject.ts";
import { DataResponse } from "./Response.ts";
import * as zod from "../../dep/zod.ts";
import { PageSession } from "./PageSession.ts";

export type Phase = "build" | "refresh" | "generate";

export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// deno-lint-ignore no-explicit-any
export type Assets = Record<string, any>;

type BaseHandlerContext<PATH extends string> = {
    phase: Phase;
    path: PathObject<PATH>;
    assets: Assets;
    descriptor: string;
};

export type DynamicHandlerContext<PATH extends string> =
    & BaseHandlerContext<PATH>
    & {
        state: Record<string, unknown>;
        request: Request;
        session?: PageSession;
    };

export type DynamicHandler<PATH extends string, DATA extends JSONValue> = (
    context: DynamicHandlerContext<PATH>,
) => Promise<DataResponse<DATA | void>> | DataResponse<DATA | void>;

export type StaticHandlerContext<PATH extends string> = BaseHandlerContext<PATH>;

export type StaticHandler<PATH extends string, DATA extends JSONValue> = (
    context: StaticHandlerContext<PATH>,
) => Promise<DataResponse<DATA | void>> | DataResponse<DATA | void>;

export type RenderContext<PATH extends string, DATA extends JSONValue> = {
    phase: Phase;
    path: PathObject<PATH>;
    data: DATA;
    pathname: string;
    descriptor: string;
    assets: Assets;
};

export type Render<PATH extends string, DATA extends JSONValue> = (
    context: RenderContext<PATH, DATA>,
) => Promise<string> | string;

interface BasePageDescriptor<PATH extends string, DATA extends JSONValue> {
    pattern: string;
    render: Render<PATH, DATA>;
    GET?: DynamicHandler<PATH, DATA>;
    POST?: DynamicHandler<PATH, DATA>;
    PUT?: DynamicHandler<PATH, DATA>;
    DELETE?: DynamicHandler<PATH, DATA>;
    PATCH?: DynamicHandler<PATH, DATA>;
}

export interface DynamicPageDescriptor<PATH extends string = string, DATA extends JSONValue = JSONValue>
    extends BasePageDescriptor<PATH, DATA> {
    type: "dynamic";
    GET: DynamicHandler<PATH, DATA>;
}

export type GetPathsParams = {
    phase: Phase;
};

export type PathList<PATH extends string = string> = PathObject<PATH>[];

export type GetPaths<PATH extends string> = (
    params: GetPathsParams,
) => Promise<PathList<PATH>> | PathList<PATH>;

export interface StaticPageDescriptor<PATH extends string = string, DATA extends JSONValue = JSONValue>
    extends BasePageDescriptor<PATH, DATA> {
    type?: "static";
    strictPaths?: boolean;
    getPaths?: GetPaths<PATH>;
    generate?: StaticHandler<PATH, DATA>;
}

export type PageDescriptor<PATH extends string = string, DATA extends JSONValue = JSONValue> =
    | StaticPageDescriptor<PATH, DATA>
    | DynamicPageDescriptor<PATH, DATA>;

const baseDescriptorSchema = zod.object({
    pattern: zod.string({
        required_error: 'A page descriptor must have a string "pattern"',
        invalid_type_error: 'Expected a page descriptor with "pattern" as a string',
    }).startsWith("/", 'A page descriptor pattern should start with a "/"'),
    render: zod.function(zod.tuple([zod.any()]), zod.any(), {
        required_error: 'A page descriptor must have a function "render"',
        invalid_type_error: 'Expected a page descriptor with "render" as a function',
    }),
    GET: zod.optional(zod.function(zod.tuple([zod.any()]), zod.any(), {
        invalid_type_error: 'Expected a dynamic page descriptor with "GET" as a function',
    })),
    POST: zod.optional(zod.function(zod.tuple([zod.any()]), zod.any(), {
        invalid_type_error: 'Expected a page descriptor with "POST" as a function',
    })),
    PUT: zod.optional(zod.function(zod.tuple([zod.any()]), zod.any(), {
        invalid_type_error: 'Expected a page descriptor with "PUT" as a function',
    })),
    PATCH: zod.optional(zod.function(zod.tuple([zod.any()]), zod.any(), {
        invalid_type_error: 'Expected a page descriptor with "PATCH" as a function',
    })),
    DELETE: zod.optional(zod.function(zod.tuple([zod.any()]), zod.any(), {
        invalid_type_error: 'Expected a page descriptor with "DELETE" as a function',
    })),
}, {
    invalid_type_error: "Expected a page descriptor object",
});

export const dynamicDescriptorSchema: zod.Schema<DynamicPageDescriptor> = baseDescriptorSchema.extend({
    GET: zod.function(zod.tuple([zod.any()]), zod.any(), {
        required_error: 'A dynamic page descriptor must have a function "GET"',
        invalid_type_error: 'Expected a dynamic page descriptor with "GET" as a function',
    }),
    type: zod.literal("dynamic", {
        required_error: 'A page descriptor must have a string "type"',
        invalid_type_error: 'Expected a dynamic page descriptor with "type" equal to "dynamic"',
    }),
});

export const staticDescriptorSchema: zod.Schema<StaticPageDescriptor> = baseDescriptorSchema.extend({
    type: zod.optional(zod.literal("static", {
        required_error: 'A page descriptor must have a string "type"',
        invalid_type_error: 'Expected a static page descriptor with "type" equal to "static"',
    })),
    strictPaths: zod.optional(zod.boolean({
        invalid_type_error: 'Expected a page descriptor with "strictPaths" as a boolean',
    })),
    getPaths: zod.optional(zod.function(zod.tuple([zod.any()]), zod.any(), {
        invalid_type_error: 'Expected a static page descriptor with "getPaths" as a function',
    })),
    generate: zod.optional(zod.function(zod.tuple([zod.any()]), zod.any(), {
        invalid_type_error: 'Expected a static page descriptor with "generate" as a function',
    })),
});

export function parseStaticDescriptor<PATH extends string, DATA extends JSONValue>(
    descriptor: unknown,
): descriptor is StaticPageDescriptor<PATH, DATA> {
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

export function parseDynamicDescriptor<PATH extends string, DATA extends JSONValue>(
    descriptor: unknown,
): descriptor is DynamicPageDescriptor<PATH, DATA> {
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
