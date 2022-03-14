import * as log from '../log/mod.ts';
import { PageRegenerator } from './PageRegenerator.ts'
import { CleanConfig } from './Config.ts'
import { FrugalContext } from './FrugalContext.ts'

function logger() {
    return log.getLogger('frugal:Regenerator');
}

type RegenerationRequest = {
    pathname: string
}

export type RegeneratorHandler = (request: RegenerationRequest) => Promise<boolean>

export class Regenerator {
    private config: CleanConfig
    private context: FrugalContext 

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config
        this.context = context
    }

    register(): RegeneratorHandler {
        this.config.setupServerLogging()

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'registering',
            },
        });

        const pageRegenerators = this.context.pages.map(page => {
            return new PageRegenerator(page, {
                cache: this.context.cache,
                context: this.context.pageContext,
                publicDir: this.config.publicDir
            })
        })

        return async (request) => {
            const pageRegenerator = getMatchingPageRegenerator(pageRegenerators, request.pathname)
            if (pageRegenerator !== undefined) {
                await pageRegenerator.regenerate(request.pathname)
                return true;
            }

            return false
        }
    }
}

function getMatchingPageRegenerator(pageRegenerators: PageRegenerator<any, any>[], pathname:string): PageRegenerator<any, any>|undefined  {
    for (const pageRegenerator of pageRegenerators) {
        if (pageRegenerator.match(pathname)) {
            return pageRegenerator
        }
    }

    return undefined
}