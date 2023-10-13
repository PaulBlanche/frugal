import * as pathToRegexp from "../../dependencies/path-to-regexp.js";

import * as descriptor from "./PageDescriptor.js";
import * as jsonValue from "./JSONValue.js";
import * as pathObject from "./PathObject.js";
import * as response from "./Response.js";
import { log } from "../log.js";

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JSONValue} [DATA=jsonValue.JSONValue]
 * @typedef {StaticPage<PATH, DATA> | DynamicPage<PATH, DATA>} Page
 */

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JSONValue} [DATA=jsonValue.JSONValue]
 * @template {descriptor.PageDescriptor<PATH, DATA>} [DESCRIPTOR=descriptor.PageDescriptor<PATH, DATA>]
 */
class BasePage {
    /** @type {string} */
    #entrypoint;
    /** @type {DESCRIPTOR} */
    #descriptor;
    /** @type {pathToRegexp.PathFunction<pathObject.PathObject<PATH>>} */
    #urlCompiler;
    /** @type {pathToRegexp.MatchFunction<pathObject.PathObject<PATH>>} */
    #urlMatcher;
    /** @type {string} */
    #moduleHash;

    /**
     * @param {DESCRIPTOR} descriptor
     * @param {string} moduleHash
     * @param {string} entrypoint
     */
    constructor(descriptor, moduleHash, entrypoint) {
        this.#descriptor = descriptor;
        this.#urlCompiler = pathToRegexp.compile(this.#descriptor.route);
        this.#urlMatcher = pathToRegexp.match(this.#descriptor.route);
        this.#moduleHash = moduleHash;
        this.#entrypoint = entrypoint;
    }

    /**
     * @param {descriptor.RenderContext<PATH, DATA>} context
     * @returns {string | ReadableStream<string>}
     */
    render(context) {
        log(
            `Rendering page "${this.entrypoint}" (${this.#moduleHash}) for path "${
                context.pathname
            }"`,
            {
                scope: "Page",
                level: "verbose",
            },
        );
        try {
            return this.#descriptor.render(context);
        } catch (/** @type {any} */ error) {
            throw new PageError(
                `Error while rendering route "${this.route}" with path "${JSON.stringify(
                    context.path,
                )}": ${error.message}`,
            );
        }
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

    /**
     * @param {pathObject.PathObject<PATH>} path
     * @returns {string}
     */
    compile(path) {
        try {
            return this.#urlCompiler(path);
        } catch (/** @type {any} */ error) {
            throw new PageError(
                `Error while compiling route "${this.route}" with path "${JSON.stringify(path)}": ${
                    error.message
                }`,
            );
        }
    }

    /**
     * @param {string} path
     * @returns {pathToRegexp.Match<pathObject.PathObject<PATH>>}
     */
    match(path) {
        return this.#urlMatcher(path);
    }
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JSONValue} [DATA=jsonValue.JSONValue]
 * @template {descriptor.DynamicPageDescriptor<PATH, DATA>} [DESCRIPTOR=descriptor.DynamicPageDescriptor<PATH, DATA>]
 * @extends {BasePage<PATH, DATA, DESCRIPTOR>}
 */
export class DynamicPage extends BasePage {
    /** @type {DESCRIPTOR} */
    #descriptor;

    /**
     * @param {DESCRIPTOR} descriptor
     * @param {string} moduleHash
     * @param {string} entrypoint
     */
    constructor(descriptor, moduleHash, entrypoint) {
        super(descriptor, moduleHash, entrypoint);
        this.#descriptor = descriptor;
    }

    get GET() {
        return this.#descriptor.GET;
    }

    /** @type {"dynamic"} */
    get type() {
        return "dynamic";
    }
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JSONValue} [DATA=jsonValue.JSONValue]
 * @template {descriptor.StaticPageDescriptor<PATH, DATA>} [DESCRIPTOR=descriptor.StaticPageDescriptor<PATH, DATA>]
 * @extends {BasePage<PATH, DATA, DESCRIPTOR>}
 */
export class StaticPage extends BasePage {
    /** @type {DESCRIPTOR} */
    #descriptor;

    /**
     * @param {DESCRIPTOR} descriptor
     * @param {string} moduleHash
     * @param {string} entrypoint
     */
    constructor(descriptor, moduleHash, entrypoint) {
        super(descriptor, moduleHash, entrypoint);
        this.#descriptor = descriptor;
    }

    get strictPaths() {
        return this.#descriptor.strictPaths ?? true;
    }

    /** @type {"static"} */
    get type() {
        return "static";
    }

    /**
     * @param {descriptor.StaticHandlerContext<PATH>} context
     * @returns {response.PageResponse<DATA> | Promise<response.PageResponse<DATA>>}
     */
    generate(context) {
        if (this.#descriptor.generate === undefined) {
            return new response.DataResponse(/** @type {DATA} */ ({}));
        }

        return this.#descriptor.generate(context);
    }

    /**
     * @param {descriptor.GetPathsParams} params
     * @returns {descriptor.PathList<PATH> | Promise<descriptor.PathList<PATH>>}
     */
    getPaths(params) {
        if (this.#descriptor.getPaths === undefined) {
            return /** @type {descriptor.PathList<PATH>} */ ([{}]);
        }
        return this.#descriptor.getPaths(params);
    }
}

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JSONValue} [DATA=jsonValue.JSONValue]
 * @param {string} entrypoint
 * @param {string} moduleHash
 * @param {descriptor.PageDescriptor<PATH, DATA>} pageDescriptor
 * @returns {Page<PATH, DATA>}
 */
export function compile(entrypoint, moduleHash, pageDescriptor) {
    if (
        typeof pageDescriptor === "object" &&
        pageDescriptor !== null &&
        "type" in pageDescriptor &&
        pageDescriptor.type === "dynamic"
    ) {
        try {
            descriptor.parseDynamicDescriptor(pageDescriptor);
            return new DynamicPage(pageDescriptor, moduleHash, entrypoint);
        } catch (/** @type {any} */ error) {
            throw new PageError(`Error while parsing descriptor "${entrypoint}": ${error.message}`);
        }
    }

    try {
        descriptor.parseStaticDescriptor(pageDescriptor);
        return new StaticPage(pageDescriptor, moduleHash, entrypoint);
    } catch (/** @type {any} */ error) {
        throw new PageError(`Error while parsing descriptor "${entrypoint}": ${error.message}`);
    }
}

export class PageError extends Error {}
