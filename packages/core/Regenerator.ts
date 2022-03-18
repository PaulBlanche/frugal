import * as log from '../log/mod.ts';
import { PageRegenerator } from './PageRegenerator.ts';
import { CleanConfig } from './Config.ts';
import { FrugalContext } from './FrugalContext.ts';

function logger() {
    return log.getLogger('frugal:Regenerator');
}

export type RegenerationRequest = {
    url: string;
};

export class Regenerator {
    private config: CleanConfig;
    private context: FrugalContext;

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config;
        this.context = context;
    }

    async handle(request: RegenerationRequest): Promise<boolean> {
        this.config.setupServerLogging();

        logger().info({
            op: 'start',
            url: request.url,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `regeneration of ${request.url}`,
            },
        });

        const pageRegenerators = this.context.pages.map((page) => {
            return new PageRegenerator(page, {
                cache: this.context.cache,
                context: this.context.pageContext,
                publicDir: this.config.publicDir,
            });
        });

        const pageRegenerator = getMatchingPageRegenerator(
            pageRegenerators,
            request.url,
        );

        if (pageRegenerator === undefined) {
            logger().info({
                url: request.url,
                msg() {
                    return `no match found for ${this.url}`;
                },
                logger: {
                    timerEnd: `regeneration of ${request.url}`,
                },
            });
            return false;
        }

        await pageRegenerator.regenerate(request.url);
        await this.context.save();

        logger().info({
            op: 'done',
            url: request.url,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `regeneration of ${request.url}`,
            },
        });

        return true;
    }
}

function getMatchingPageRegenerator(
    pageRegenerators: PageRegenerator<any, any>[],
    pathname: string,
): PageRegenerator<any, any> | undefined {
    for (const pageRegenerator of pageRegenerators) {
        if (pageRegenerator.match(pathname)) {
            return pageRegenerator;
        }
    }

    return undefined;
}
