import { Config, CleanConfig } from './Config.ts'
import { Builder } from './Builder.ts'
import { Regenerator, RegeneratorHandler } from './Regenerator.ts'
import { FrugalContext, loadContext } from './FrugalContext.ts'

export class Frugal {
    config: CleanConfig
    context: FrugalContext

    static async load(config: Config) {
        const cleanConfig = await CleanConfig.load(config)
        const context = await loadContext(cleanConfig)
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

    async close() {
        await this.context.cache.save(this.config.cachePath);
    }

    register(): RegeneratorHandler {
        const regenerator = new Regenerator(this.config, this.context)
        return regenerator.register()
    }
}



