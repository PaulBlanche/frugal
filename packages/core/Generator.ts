import * as log from '../log/mod.ts';
import { PageGenerator } from './PageGenerator.ts';
import { CleanConfig } from './Config.ts';
import { FrugalContext } from './FrugalContext.ts';
import { DynamicPage } from './Page.ts';

function logger() {
    return log.getLogger('frugal:Generator');
}

export class Generator {
    private config: CleanConfig;
    private context: FrugalContext;
    private generators: PageGenerator<any, any>[];

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config;
        this.context = context;
        this.generators = this.context.pages.filter((page) =>
            page instanceof DynamicPage
        ).map((page) => {
            return new PageGenerator(page, {
                cache: this.context.cache,
                context: this.context.pageContext,
                publicDir: this.config.publicDir,
            });
        });
    }

    get routes() {
        return this.generators.map((generator) => generator.route);
    }

    async generate(pathname: string, urlSearchParams: URLSearchParams) {
        this.config.setupServerLogging();

        logger().info({
            op: 'start',
            pathname,
            urlSearchParams,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart:
                    `generation of ${pathname}?${urlSearchParams.toString()}`,
            },
        });

        const pageGenerator = this.getMatchingGenerator(pathname);

        if (pageGenerator === undefined) {
            logger().info({
                pathname,
                urlSearchParams,
                msg() {
                    return `no match found for ${this.pathname}`;
                },
                logger: {
                    timerEnd:
                        `generation of ${pathname}?${urlSearchParams.toString()}`,
                },
            });
            return undefined;
        }

        const result = await pageGenerator.generate(pathname, urlSearchParams);
        await this.context.save();

        logger().info({
            op: 'done',
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd:
                    `generation of ${pathname}?${urlSearchParams.toString()}`,
            },
        });

        return result;
    }

    private getMatchingGenerator(
        pathname: string,
    ): PageGenerator<any, any> | undefined {
        for (const pageGenerator of this.generators) {
            if (pageGenerator.match(pathname)) {
                return pageGenerator;
            }
        }

        return undefined;
    }
}
