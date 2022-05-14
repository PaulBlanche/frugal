import * as log from '../log/mod.ts';
import { PageBuilder } from './PageBuilder.ts';
import { CleanConfig } from './Config.ts';

function logger() {
    return log.getLogger('frugal:Builder');
}

export class Builder {
    private config: CleanConfig;
    // deno-lint-ignore no-explicit-any
    builders: PageBuilder<any, any, any>[];

    constructor(
        config: CleanConfig,
        // deno-lint-ignore no-explicit-any
        builders: PageBuilder<any, any, any>[],
    ) {
        this.config = config;
        this.builders = builders;
    }

    async build() {
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
