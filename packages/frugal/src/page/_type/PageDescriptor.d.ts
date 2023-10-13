import { JSONValue } from "./JSONValue.js";
import { PathObject } from "./PathObject.js";
import { PageResponse } from "./Response.js";
import { PageSession } from "./PageSession.js";
import { Assets } from "../Assets.js";

export type Phase = "build" | "refresh" | "generate";

export type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type BaseHandlerContext<PATH extends string> = {
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

export type DynamicHandlerContext<PATH extends string> = BaseHandlerContext<PATH> & DynamicExtra;

export type DynamicHandler<PATH extends string, DATA extends JSONValue> = (
    context: DynamicHandlerContext<PATH>,
) => Promise<PageResponse<DATA>> | PageResponse<DATA>;

export type StaticHandlerContext<PATH extends string> = BaseHandlerContext<PATH>;

export type HybridHandlerContext<PATH extends string> = BaseHandlerContext<PATH> &
    Partial<DynamicExtra>;

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
    route: string;
    render: Render<PATH, DATA>;
    GET?: DynamicHandler<PATH, DATA>;
    POST?: DynamicHandler<PATH, DATA>;
    PUT?: DynamicHandler<PATH, DATA>;
    DELETE?: DynamicHandler<PATH, DATA>;
    PATCH?: DynamicHandler<PATH, DATA>;
}

export interface DynamicPageDescriptor<
    PATH extends string = string,
    DATA extends JSONValue = JSONValue,
> extends BasePageDescriptor<PATH, DATA> {
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

export interface StaticPageDescriptor<
    PATH extends string = string,
    DATA extends JSONValue = JSONValue,
> extends BasePageDescriptor<PATH, DATA> {
    type?: "static";
    strictPaths?: boolean;
    getPaths?: GetPaths<PATH>;
    generate?: StaticHandler<PATH, DATA>;
}

export type PageDescriptor<PATH extends string = string, DATA extends JSONValue = JSONValue> =
    | StaticPageDescriptor<PATH, DATA>
    | DynamicPageDescriptor<PATH, DATA>;
