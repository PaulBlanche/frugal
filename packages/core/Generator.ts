import * as log from '../log/mod.ts';
import { PageGenerator } from './PageGenerator.ts';
import { GenerationRequest } from './Page.ts';
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
        // deno-lint-ignore no-explicit-any
        request: GenerationRequest<any>,
    ) {
        logger().info({
            op: 'start',
            request,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `generation of ${requestToString(request)}`,
            },
        });

        const pageGenerator = this.getMatchingGenerator(request);

        if (pageGenerator === undefined) {
            logger().info({
                request,
                msg() {
                    return `no match found for ${requestToString(request)}`;
                },
                logger: {
                    timerEnd: `generation of ${requestToString(request)}`,
                },
            });
            return undefined;
        }

        const result = await pageGenerator.generate(request);

        logger().info({
            op: 'done',
            request,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `generation of ${requestToString(request)}`,
            },
        });

        return result;
    }

    private getMatchingGenerator(
        // deno-lint-ignore no-explicit-any
        request: GenerationRequest<any>,
        // deno-lint-ignore no-explicit-any
    ): PageGenerator<any, any, any> | undefined {
        const pathname = new URL(request.url).pathname;
        for (const pageGenerator of this.generators) {
            if (pageGenerator.match(pathname)) {
                return pageGenerator;
            }
        }

        return undefined;
    }
}

// deno-lint-ignore no-explicit-any
export function requestToString(request: GenerationRequest<any>) {
    return `${request.method} ${request.url}`;
}
