import { fromFileUrl } from "../../dep/std/path.ts";

import * as descriptor from "./PageDescriptor.ts";
import * as page from "./Page.ts";
import { JSONValue } from "./JSONValue.ts";
import { GenerationResult } from "./GenerationResult.ts";
import { PageSession } from "./PageSession.ts";
import { log } from "../log.ts";
import { FrugalConfig } from "../Config.ts";
import { AssetRepository, Assets } from "./Assets.ts";

export type DynamicPageGeneratorConfig<PATH extends string = string, DATA extends JSONValue = JSONValue> = {
    page: page.Page<PATH, DATA>;
    assets: AssetRepository;
    configHash: string;
    config: FrugalConfig;
};

export class DynamicPageGenerator<PATH extends string = string, DATA extends JSONValue = JSONValue> {
    #config: DynamicPageGeneratorConfig<PATH, DATA>;
    #assets: Assets;

    constructor(config: DynamicPageGeneratorConfig<PATH, DATA>) {
        this.#config = config;
        this.#assets = new Assets(this.#config.assets, this.#config.page.entrypoint);
    }

    async generate(
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

        return await this.#getGenerationResult(pathname, {
            phase: "generate",
            request,
            path,
            state,
            assets: this.#assets,
            descriptor: this.#config.page.entrypoint,
            session,
            resolve: (path) => this.#config.config.resolve(path),
            publicdir: fromFileUrl(this.#config.config.publicdir),
        });
    }

    async #getGenerationResult(
        pathname: string,
        context: descriptor.DynamicHandlerContext<PATH>,
    ): Promise<GenerationResult<PATH, DATA> | undefined> {
        const method = context.request.method as descriptor.Method;
        const handler = this.#config.page[method];
        if (handler === undefined) {
            log(`Page ${this.#config.page.route} cannot handle ${context.request.method} requests`, {
                scope: "DybamicPageGenerator",
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
}
