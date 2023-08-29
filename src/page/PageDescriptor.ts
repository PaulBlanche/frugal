import { JSONValue } from "./JSONValue.ts";
import { PathObject } from "./PathObject.ts";
import { PageResponse } from "./Response.ts";
import * as zod from "../../dep/zod.ts";
import { PageSession } from "./PageSession.ts";
import { Assets } from "./Assets.ts";

export type Phase = "build" | "refresh" | "generate";

export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type BaseHandlerContext<PATH extends string = ""> = {
    phase: Phase;
    path: PathObject<PATH>;
    assets: Assets;
    descriptor: string;
    resolve: (path: string) => string;
    publicdir: string;
};

type DynamicExtra = {
    state: Record<string, unknown>;
    request: Request;
    session?: PageSession;
};

export type DynamicHandlerContext<PATH extends string> =
    & BaseHandlerContext<PATH>
    & DynamicExtra;

export type DynamicHandler<PATH extends string, DATA extends JSONValue> = (
    context: DynamicHandlerContext<PATH>,
) => Promise<PageResponse<DATA>> | PageResponse<DATA>;

export type StaticHandlerContext<PATH extends string> = BaseHandlerContext<PATH>;

export type HybridHandlerContext<PATH extends string> = BaseHandlerContext<PATH> & Partial<DynamicExtra>;

export type StaticHandler<PATH extends string, DATA extends JSONValue> = (
    context: StaticHandlerContext<PATH>,
) => Promise<PageResponse<DATA>> | PageResponse<DATA>;

export type RenderContext<PATH extends string, DATA extends JSONValue = JSONValue> = {
    phase: Phase;
    path: PathObject<PATH>;
    data: DATA;
    pathname: string;
    descriptor: string;
    assets: Assets;
};

export type Render<PATH extends string, DATA extends JSONValue> = (
    context: RenderContext<PATH, DATA>,
) => string | ReadableStream<string>;

interface BasePageDescriptor<PATH extends string, DATA extends JSONValue> {
    route?: string;
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
    resolve: (path: string) => string;
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

export const routeSchema = zod.string({
    required_error: 'A page descriptor must have a string "route"',
    invalid_type_error: 'Expected a page descriptor with "route" as a string',
}).startsWith("/", 'A page descriptor route should start with a "/"');

const baseDescriptorSchema = zod.object({
    route: zod.optional(routeSchema),
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

export function parseRoute(route: unknown): string {
    try {
        return routeSchema.parse(route);
    } catch (error) {
        if (error instanceof zod.ZodError) {
            throw new Error(error.errors[0].message);
        }
        throw error;
    }
}
