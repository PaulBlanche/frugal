import * as pathToRegexp from "../../dep/path-to-regexp.ts";

import * as descriptor from "./PageDescriptor.ts";
import { PathObject } from "./PathObject.ts";
import { JSONValue } from "./JSONValue.ts";
import { log } from "../log.ts";
import { DataResponse } from "./Response.ts";

class BasePage<
    PATH extends string = string,
    DATA extends JSONValue = JSONValue,
    DESCRIPTOR extends descriptor.PageDescriptor<PATH, DATA> = descriptor.PageDescriptor<
        PATH,
        DATA
    >,
> {
    #entrypoint: string;
    #descriptor: DESCRIPTOR;
    #urlCompiler: pathToRegexp.PathFunction<PathObject<PATH>>;
    #urlMatcher: pathToRegexp.MatchFunction<PathObject<PATH>>;
    #moduleHash: string;

    constructor(descriptor: DESCRIPTOR, moduleHash: string, entrypoint: string) {
        this.#descriptor = descriptor;
        this.#urlCompiler = pathToRegexp.compile(this.#descriptor.route);
        this.#urlMatcher = pathToRegexp.match(this.#descriptor.route);
        this.#moduleHash = moduleHash;
        this.#entrypoint = entrypoint;
    }

    render(context: descriptor.RenderContext<PATH, DATA>) {
        log(`Rendering page "${this.entrypoint}" (${this.#moduleHash}) for path "${context.pathname}"`, {
            scope: "Page",
            level: "verbose",
        });
        return this.#descriptor.render(context);
    }

    get moduleHash() {
        return this.#moduleHash;
    }

    get entrypoint() {
        return this.#entrypoint;
    }

    get route() {
        return this.#descriptor.route;
    }

    get GET() {
        return this.#descriptor.GET;
    }

    get POST() {
        return this.#descriptor.POST;
    }

    get PUT() {
        return this.#descriptor.PUT;
    }

    get PATCH() {
        return this.#descriptor.PATCH;
    }

    get DELETE() {
        return this.#descriptor.DELETE;
    }

    compile(path: PathObject<PATH>) {
        try {
            return this.#urlCompiler(path);
        } catch (error: unknown) {
            throw new CompileError(
                `Error while compiling route "${this.route}" with path "${JSON.stringify(path)}"`,
                { cause: error },
            );
        }
    }

    match(path: string) {
        return this.#urlMatcher(path);
    }
}

export class DynamicPage<
    PATH extends string = string,
    DATA extends JSONValue = JSONValue,
    DESCRIPTOR extends descriptor.DynamicPageDescriptor<PATH, DATA> = descriptor.DynamicPageDescriptor<PATH, DATA>,
> extends BasePage<PATH, DATA, DESCRIPTOR> {
    #descriptor: DESCRIPTOR;

    constructor(descriptor: DESCRIPTOR, moduleHash: string, entrypoint: string) {
        super(descriptor, moduleHash, entrypoint);
        this.#descriptor = descriptor;
    }

    get GET() {
        return this.#descriptor.GET;
    }
}

export class StaticPage<
    PATH extends string = string,
    DATA extends JSONValue = JSONValue,
    DESCRIPTOR extends descriptor.StaticPageDescriptor<PATH, DATA> = descriptor.StaticPageDescriptor<PATH, DATA>,
> extends BasePage<PATH, DATA, DESCRIPTOR> {
    #descriptor: descriptor.StaticPageDescriptor<PATH, DATA>;

    constructor(descriptor: DESCRIPTOR, moduleHash: string, entrypoint: string) {
        super(descriptor, moduleHash, entrypoint);
        this.#descriptor = descriptor;
    }

    get strictPaths() {
        return this.#descriptor.strictPaths ?? true;
    }

    generate(context: descriptor.StaticHandlerContext<PATH>) {
        if (this.#descriptor.generate === undefined) {
            // deno-lint-ignore no-explicit-any
            return new DataResponse<DATA>({ data: {} } as any);
        }

        return this.#descriptor.generate(context);
    }

    getPaths(params: descriptor.GetPathsParams) {
        if (this.#descriptor.getPaths === undefined) {
            return [{}] as descriptor.PathList<PATH>;
        }
        return this.#descriptor.getPaths(params);
    }
}

export type Page<
    PATH extends string = string,
    DATA extends JSONValue = JSONValue,
> =
    | StaticPage<PATH, DATA>
    | DynamicPage<PATH, DATA>;

/**
 * Build a page object from a page descriptor
 */
export function compile<PATH extends string = string, DATA extends JSONValue = JSONValue>(
    entrypoint: string,
    moduleHash: string,
    pageDescriptor: descriptor.PageDescriptor<PATH, DATA>,
): Page<PATH, DATA> {
    if (
        typeof pageDescriptor === "object" &&
        pageDescriptor !== null &&
        "type" in pageDescriptor && pageDescriptor.type === "dynamic"
    ) {
        try {
            descriptor.parseDynamicDescriptor<PATH, DATA>(pageDescriptor);
            return new DynamicPage(pageDescriptor, moduleHash, entrypoint);
        } catch (error) {
            throw new CompileError(
                `Error while parsing descriptor "${entrypoint}"`,
                { cause: error },
            );
        }
    }

    try {
        descriptor.parseStaticDescriptor<PATH, DATA>(pageDescriptor);
        return new StaticPage(pageDescriptor, moduleHash, entrypoint);
    } catch (error) {
        throw new CompileError(
            `Error while parsing descriptor "${entrypoint}"`,
            { cause: error },
        );
    }
}

export class CompileError extends Error {}
