import * as log from '../log/mod.ts';
import { PageBuilder } from './PageBuilder.ts';
import { CleanConfig } from './Config.ts';
import { FrugalContext } from './FrugalContext.ts';
import { StaticPage } from './Page.ts';

function logger() {
    return log.getLogger('frugal:Builder');
}

export class Builder {
    private config: CleanConfig
    private context: FrugalContext;
    private builders: PageBuilder<any, any>[];

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config;
        this.context = context;
        this.builders = this.context.pages.filter(page => page instanceof StaticPage).map((page) => {
            return new PageBuilder(
                page,
                {
                    cache: this.context.cache,
                    context: this.context.pageContext,
                    publicDir: this.config.publicDir,
                },
            );
        })
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

        await Promise.all(this.builders.map(async (builder) => {
            await builder.buildAll();
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
