import { fromFileUrl } from "../../dep/std/path.ts";

import * as descriptor from "./PageDescriptor.ts";
import * as page from "./Page.ts";
import { PathObject } from "./PathObject.ts";
import { JSONValue } from "./JSONValue.ts";
import { GenerationResult } from "./GenerationResult.ts";
import { Cache } from "../cache/Cache.ts";
import { log } from "../log.ts";
import { PageSession } from "./PageSession.ts";
import { FrugalConfig } from "../Config.ts";

type StaticPageGeneratorConfig<PATH extends string = string, DATA extends JSONValue = JSONValue> = {
    page: page.StaticPage<PATH, DATA>;
    assets: descriptor.Assets;
    configHash: string;
    cache: Cache;
    config: FrugalConfig;
};

export class StaticPageGenerator<PATH extends string = string, DATA extends JSONValue = JSONValue> {
    #config: StaticPageGeneratorConfig<PATH, DATA>;

    constructor(config: StaticPageGeneratorConfig<PATH, DATA>) {
        this.#config = config;
    }

    async buildAll() {
        const pathList = await this.#config.page.getPaths({
            phase: "build",
            resolve: (path) => this.#config.config.resolve(path),
        });

        await Promise.all(pathList.map(async (path) => {
            await this.build(path, "build");
        }));
    }

    async build(buildPath: PathObject<PATH>, phase: descriptor.Phase): Promise<void> {
        const pathname = this.#config.page.compile(buildPath);

        log(`Building path "${pathname}" for page "${this.#config.page.entrypoint}"`, {
            scope: "StaticPageGenerator",
            level: "debug",
        });

        const response = await this.#getStaticGenerationResult(pathname, buildPath, phase);

        await this.#config.cache.add(response);
    }

    async refresh(request: Request): Promise<void> {
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

    async generate(
        type: "static" | "dynamic",
        request: Request,
        state: Record<string, unknown>,
        session?: PageSession,
    ): Promise<GenerationResult<PATH, DATA> | undefined> {
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
                assets: this.#config.assets,
                descriptor: this.#config.page.entrypoint,
                session,
                resolve: (path) => this.#config.config.resolve(path),
                publicdir: fromFileUrl(this.#config.config.publicdir),
            });
        } else {
            return await this.#getStaticGenerationResult(pathname, path, "generate");
        }
    }

    async #getDynamicGenerationResult(
        pathname: string,
        context: descriptor.DynamicHandlerContext<PATH>,
    ): Promise<GenerationResult<PATH, DATA> | undefined> {
        const method = context.request.method as descriptor.Method;
        const handler = method === "GET"
            ? this.#config.page.generate.bind(this.#config.page)
            : this.#config.page[method];

        if (handler === undefined) {
            log(`Page ${this.#config.page.route} cannot handle ${context.request.method} requests`, {
                scope: "StaticPageGenerator",
                level: "debug",
            });
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

    async #getStaticGenerationResult(pathname: string, buildPath: PathObject<PATH>, phase: descriptor.Phase) {
        return new GenerationResult(
            await this.#config.page.generate({
                phase,
                path: buildPath,
                assets: this.#config.assets,
                descriptor: this.#config.page.entrypoint,
                resolve: (path) => this.#config.config.resolve(path),
                publicdir: fromFileUrl(this.#config.config.publicdir),
            }),
            {
                phase,
                path: buildPath,
                assets: this.#config.assets,
                descriptor: this.#config.page.entrypoint,
                pathname,
                moduleHash: this.#config.page.moduleHash,
                configHash: this.#config.configHash,
                render: (context) => this.#config.page.render(context),
            },
        );
    }
}
