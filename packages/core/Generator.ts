import * as log from '../log/mod.ts';
import { GenerationContext, PageGenerator } from './PageGenerator.ts';
import { CleanConfig } from './Config.ts';
function logger() {
    return log.getLogger('frugal:Generator');
}

export class Generator {
    private config: CleanConfig;
    private generators: PageGenerator<any, any, any>[];

    constructor(
        config: CleanConfig,
        generators: PageGenerator<any, any, any>[],
    ) {
        this.config = config;
        this.generators = generators;
    }

    get routes() {
        return this.generators.map((generator) => generator.route);
    }

    async generate(
        pathname: string,
        context: GenerationContext<any>,
    ) {
        await this.config.setupServerLogging();

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
    ): PageGenerator<any, any, any> | undefined {
        for (const pageGenerator of this.generators) {
            if (pageGenerator.match(pathname)) {
                return pageGenerator;
            }
        }

        return undefined;
    }
}
