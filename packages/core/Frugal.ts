import { CleanConfig, Config } from './Config.ts';
import { Builder } from './Builder.ts';
import { Refresher } from './Refresher.ts';
import { Generator } from './Generator.ts';
import { FrugalContext } from './FrugalContext.ts';
export class Frugal {
    private builder: Builder
    private refresher: Refresher
    private generator: Generator

    static async load(config: Config) {
        const cleanConfig = await CleanConfig.load(config);
        const context = await FrugalContext.load(cleanConfig);
        return new Frugal(cleanConfig, context);
    }

    static async build(config: Config) {
        const cleanConfig = await CleanConfig.load(config);
        const context = await FrugalContext.build(cleanConfig);
        return new Frugal(cleanConfig, context);
    }

    constructor(config: CleanConfig, context: FrugalContext) {
        this.builder = new Builder(config, context)
        this.refresher = new Refresher(config, context)
        this.generator = new Generator(config, context)
    }

    // build all registered static pages
    async build() {
        await this.builder.build();
    }

    // refresh a specific static page (might do nothing if nothing changed)
    refresh(pathname: string) {
        return this.refresher.refresh(pathname);
    }

    // generate a specific dynamic page (allways generate even if nothing changed)
    generate(pathname: string, urlSearchParams: URLSearchParams) {
        return this.generator.generate(pathname, urlSearchParams);
    }

    get refreshRoutes() {
        return this.refresher.routes
    }

    get generateRoutes() {
        return this.generator.routes
    }

}

export async function build(config: Config) {
    const frugal = await Frugal.build(config);
    await frugal.build();
}
