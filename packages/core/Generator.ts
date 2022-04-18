import * as log from '../log/mod.ts';
import { GenerationContext, PageGenerator } from './PageGenerator.ts';
import { CleanConfig } from './Config.ts';
function logger() {
    return log.getLogger('frugal:Generator');
}

export class Generator {
    private config: CleanConfig;
    // deno-lint-ignore no-explicit-any
    generators: PageGenerator<any, any, any>[];

    constructor(
        config: CleanConfig,
        // deno-lint-ignore no-explicit-any
        generators: PageGenerator<any, any, any>[],
    ) {
        this.config = config;
        this.generators = generators;
    }

    async generate(
        pathname: string,
        context: GenerationContext<unknown>,
    ) {
        logger().info({
            op: 'start',
            pathname,
            context,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart:
                    `generation of ${pathname}?${context.searchParams.toString()}`,
            },
        });

        const pageGenerator = this.getMatchingGenerator(pathname);

        if (pageGenerator === undefined) {
            logger().info({
                pathname,
                context,
                msg() {
                    return `no match found for ${this.pathname}`;
                },
                logger: {
                    timerEnd:
                        `generation of ${context.method} ${pathname}?${context.searchParams.toString()}`,
                },
            });
            return undefined;
        }

        const result = await pageGenerator.generate(pathname, context);

        logger().info({
            op: 'done',
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd:
                    `generation of ${context.method} ${pathname}?${context.searchParams.toString()}`,
            },
        });

        return result;
    }

    private getMatchingGenerator(
        pathname: string,
        // deno-lint-ignore no-explicit-any
    ): PageGenerator<any, any, any> | undefined {
        for (const pageGenerator of this.generators) {
            if (pageGenerator.match(pathname)) {
                return pageGenerator;
            }
        }

        return undefined;
    }
}
