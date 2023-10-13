import * as _type from "./_type/StaticPageGenerator.js";
export * from "./_type/StaticPageGenerator.js";

import * as descriptor from "./PageDescriptor.js";
import * as pathObject from "./PathObject.js";
import * as jsonValue from "./JSONValue.js";
import { GenerationResult } from "./GenerationResult.js";
import { log } from "../log.js";
import * as pageSession from "./PageSession.js";
import { Assets } from "./Assets.js";

/**
 * @template {string} [PATH=string]
 * @template {jsonValue.JSONValue} [DATA=jsonValue.JSONValue]
 */
export class StaticPageGenerator {
    /** @type {_type.StaticPageGeneratorConfig<PATH, DATA>} */
    #config;
    /** @type {Assets} */
    #assets;

    /** @param {_type.StaticPageGeneratorConfig<PATH, DATA>} config */
    constructor(config) {
        this.#config = config;
        this.#assets = new Assets(this.#config.assets, this.#config.page.entrypoint);
    }

    async buildAll() {
        const pathList = await this.#config.page.getPaths({
            phase: "build",
            resolve: (path) => this.#config.config.resolve(path),
        });

        await Promise.all(
            pathList.map(async (path) => {
                await this.build(path, "build");
            }),
        );
    }

    /**
     * @param {pathObject.PathObject<PATH>} buildPath
     * @param {descriptor.Phase} phase
     * @returns {Promise<void>}
     */
    async build(buildPath, phase) {
        const pathname = this.#config.page.compile(buildPath);

        log(`Building path "${pathname}" for page "${this.#config.page.entrypoint}"`, {
            scope: "StaticPageGenerator",
            level: "debug",
        });

        const response = await this.#getStaticGenerationResult(pathname, buildPath, phase);

        await this.#config.cache.add(response);
    }

    /**
     * @param {Request} request
     * @returns {Promise<void>}
     */
    async refresh(request) {
        const pathname = new URL(request.url).pathname;
        const match = this.#config.page.match(pathname);

        if (match === false) {
            throw new Error(
                `pathname "${pathname} did not match pattern "${this.#config.page.route}"`,
            );
        }

        log(`Refreshing path "${pathname}" for page "${this.#config.page.entrypoint}"`, {
            scope: "StaticPageGenerator",
            level: "debug",
        });

        const path = match.params;

        return await this.build(path, "refresh");
    }

    /**
     * @param {"static" | "dynamic"} type
     * @param {Request} request
     * @param {Record<string, unknown>} state
     * @param {pageSession.PageSession} [session]
     * @returns {Promise<GenerationResult<PATH, DATA> | undefined>}
     */
    async generate(type, request, state, session) {
        const pathname = new URL(request.url).pathname;
        const match = this.#config.page.match(pathname);

        if (match === false) {
            throw new Error(
                `pathname "${pathname} did not match pattern "${this.#config.page.route}"`,
            );
        }

        const path = match.params;

        log(`Generating path "${pathname}" for page "${this.#config.page.entrypoint}"`, {
            scope: "StaticPageGenerator",
            level: "debug",
        });

        if (type === "dynamic") {
            return await this.#getDynamicGenerationResult(pathname, {
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
        } else {
            return await this.#getStaticGenerationResult(pathname, path, "generate");
        }
    }

    /**
     * @param {string} pathname
     * @param {descriptor.DynamicHandlerContext<PATH>} context
     * @returns {Promise<GenerationResult<PATH, DATA> | undefined>}
     */
    async #getDynamicGenerationResult(pathname, context) {
        const method = /** @type {descriptor.Method} */ (context.request.method);
        const handler =
            method === "GET"
                ? this.#config.page.generate.bind(this.#config.page)
                : this.#config.page[method];

        if (handler === undefined) {
            log(
                `Page ${this.#config.page.route} cannot handle ${context.request.method} requests`,
                {
                    scope: "StaticPageGenerator",
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

    /**
     * @param {string} pathname
     * @param {pathObject.PathObject<PATH>} buildPath
     * @param {descriptor.Phase} phase
     * @returns
     */
    async #getStaticGenerationResult(pathname, buildPath, phase) {
        return new GenerationResult(
            await this.#config.page.generate({
                phase,
                path: buildPath,
                assets: this.#assets,
                descriptor: this.#config.page.entrypoint,
                resolve: (path) => this.#config.config.resolve(path),
                publicdir: this.#config.config.publicdir,
            }),
            {
                phase,
                path: buildPath,
                assets: this.#assets,
                descriptor: this.#config.page.entrypoint,
                pathname,
                moduleHash: this.#config.page.moduleHash,
                configHash: this.#config.configHash,
                render: (context) => this.#config.page.render(context),
            },
        );
    }
}
