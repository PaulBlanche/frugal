import { Config, CleanConfig } from './Config.ts'
import { Builder } from './Builder.ts'
import { Regenerator, RegenerationRequest } from './Regenerator.ts'
import { FrugalContext } from './FrugalContext.ts'
import * as worker from './RegeneratorWorker.ts'
export class Frugal {
    config: CleanConfig
    context: FrugalContext

    static async load(config: Config) {
        const cleanConfig = await CleanConfig.load(config)
        const context = await FrugalContext.load(cleanConfig)
        return new Frugal(cleanConfig, context)
    }

    static async build(config: Config) {
        const cleanConfig = await CleanConfig.load(config)
        const context = await FrugalContext.build(cleanConfig)
        return new Frugal(cleanConfig, context)
    }

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config
        this.context = context
    }

    async build() {
        const builder = new Builder(this.config, this.context)
        await builder.build()
    }

    handleRegenerate(request: RegenerationRequest) {
        const regenerator = new Regenerator(this.config, this.context)
        return regenerator.handle(request)
    }

    regenerate(request: RegenerationRequest) {
        return worker.regenerate(request, this.config.configPath)
    }
}

export async function build(config: Config) {
    const frugal = await Frugal.build(config)
    await frugal.build()
}