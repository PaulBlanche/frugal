import * as log from '../log/mod.ts';
import { PageBuilder } from './PageBuilder.ts';
import { CleanConfig } from './Config.ts';
import { FrugalContext } from './FrugalContext.ts';

function logger() {
    return log.getLogger('frugal:Builder');
}

export class Builder {
    private config: CleanConfig;
    private context: FrugalContext;

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config;
        this.context = context;
    }

    async build() {
        this.config.setupBuildLogging();

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'build',
            },
        });

        await Promise.all(this.context.pages.map(async (page) => {
            const builder = new PageBuilder(
                page,
                {
                    cache: this.context.cache,
                    context: this.context.pageContext,
                    publicDir: this.config.publicDir,
                },
            );

            await builder.generateAll();
        }));

        await this.context.save();

        logger().info({
            op: 'done',
            msg() {
                return `${this.op} ${this.logger!.timerEnd}`;
            },
            logger: {
                timerEnd: 'build',
            },
        });
    }
}
