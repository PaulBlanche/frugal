import * as _type from "./_type/DynamicPageGenerator.js";
export * from "./_type/DynamicPageGenerator.js";

import * as descriptor from "./PageDescriptor.js";
import * as jsonValue from "./JSONValue.js";
import { GenerationResult } from "./GenerationResult.js";
import * as pageSession from "./PageSession.js";
import { log } from "../log.js";
import { Assets } from "./Assets.js";

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JSONValue} [DATA=jsonValue.JSONValue]
 */
export class DynamicPageGenerator {
    /** @type {_type.DynamicPageGeneratorConfig<PATH, DATA>} */
    #config;
    /** @type {Assets} */
    #assets;

    /** @param {_type.DynamicPageGeneratorConfig<PATH, DATA>} config */
    constructor(config) {
        this.#config = config;
        this.#assets = new Assets(this.#config.assets, this.#config.page.entrypoint);
    }

    /**
     * @param {Request} request
     * @param {Record<string, unknown>} state
     * @param {pageSession.PageSession} [session]
     * @returns {Promise<GenerationResult<PATH, DATA> | undefined>}
     */
    async generate(request, state, session) {
        const pathname = new URL(request.url).pathname;
        const match = this.#config.page.match(pathname);

        if (match === false) {
            throw new Error(
                `pathname "${pathname} did not match pattern "${this.#config.page.route}"`,
            );
        }

        const path = match.params;

        return await this.#getGenerationResult(pathname, {
            phase: "generate",
            request,
            path,
            state,
            assets: this.#assets,
            descriptor: this.#config.page.entrypoint,
            session,
            resolve: (path) => this.#config.config.resolve(path),
            publicdir: this.#config.config.publicdir,
        });
    }

    /**
     * @param {string} pathname
     * @param {descriptor.DynamicHandlerContext<PATH>} context
     * @returns {Promise<GenerationResult<PATH, DATA> | undefined>}
     */
    async #getGenerationResult(pathname, context) {
        const method = /** @type {descriptor.Method} */ (context.request.method);
        const handler = this.#config.page[method];
        if (handler === undefined) {
            log(
                `Page ${this.#config.page.route} cannot handle ${context.request.method} requests`,
                {
                    scope: "DybamicPageGenerator",
                    level: "debug",
                },
            );
            return undefined;
        }

        return new GenerationResult(await handler(context), {
            pathname,
            moduleHash: this.#config.page.moduleHash,
            configHash: this.#config.configHash,
            phase: context.phase,
            path: context.path,
            descriptor: context.descriptor,
            assets: context.assets,
            render: (context) => this.#config.page.render(context),
        });
    }
}
