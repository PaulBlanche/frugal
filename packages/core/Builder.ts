import * as log from '../log/mod.ts';
import { PageBuilder } from './PageBuilder.ts';
import { CleanConfig } from './Config.ts';

function logger() {
    return log.getLogger('frugal:Builder');
}

export class Builder {
    private config: CleanConfig;
    builders: PageBuilder<any, any, any>[];

    constructor(
        config: CleanConfig,
        builders: PageBuilder<any, any, any>[],
    ) {
        this.config = config;
        this.builders = builders;
    }

    async build() {
        await this.config.setupBuildLogging();

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
