import { CleanConfig, Config } from './Config.ts';
import { Builder } from './Builder.ts';
import { Refresher } from './Refresher.ts';
import { Generator } from './Generator.ts';
import { FrugalContext } from './FrugalContext.ts';
import { StaticPage } from './Page.ts';
import { PageBuilder } from './PageBuilder.ts';
import * as log from '../log/mod.ts';

function logger() {
    return log.getLogger('frugal:Frugal');
}

export class Frugal {
    private builder: Builder;
    private refresher: Refresher;
    private generator: Generator;
    config: CleanConfig;

    static async load(config: Config) {
        const cleanConfig = await CleanConfig.load(config);

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'loading frugal context',
            },
        });

        const context = await FrugalContext.load(cleanConfig);
        const frugal = new Frugal(cleanConfig, context);

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'loading frugal context',
            },
        });

        return frugal;
    }

    static async build(config: Config) {
        const cleanConfig = await CleanConfig.load(config);

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'building frugal context',
            },
        });

        const context = await FrugalContext.build(cleanConfig);
        const frugal = new Frugal(cleanConfig, context);

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'building frugal context',
            },
        });

        return frugal;
    }

    constructor(config: CleanConfig, context: FrugalContext) {
        const staticPages = context.pages.filter((page) =>
            page instanceof StaticPage
        );

        this.builder = new Builder(
            config,
            context,
            staticPages.map((page) => {
                return new PageBuilder(
                    page,
                    {
                        cache: context.cache,
                        loaderContext: context.loaderContext,
                        publicDir: config.publicDir,
                    },
                );
            }),
        );
        this.refresher = new Refresher(config, context);
        this.generator = new Generator(config, context);
        this.config = config;
    }

    // build all registered static pages
    async build() {
        this.config.setupBuildLogging();

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'building',
            },
        });

        await this.builder.build();

        logger().info({
            op: 'done',
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: 'building',
            },
        });
    }

    // refresh a specific static page (might do nothing if nothing changed)
    async refresh(pathname: string) {
        await this.config.setupServerLogging();

        logger().info({
            op: 'start',
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `refreshing ${pathname}`,
            },
        });

        const result = await this.refresher.refresh(pathname);

        logger().info({
            op: 'done',
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `refreshing ${pathname}`,
            },
        });

        return result;
    }

    // generate a specific dynamic page (allways generate even if nothing changed)
    async generate(pathname: string, urlSearchParams: URLSearchParams) {
        await this.config.setupServerLogging();

        logger().info({
            op: 'start',
            pathname,
            searchParams: urlSearchParams.toString(),
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart:
                    `generating ${pathname}?${urlSearchParams.toString()}`,
            },
        });

        const result = await this.generator.generate(pathname, urlSearchParams);

        logger().info({
            op: 'done',
            pathname,
            searchParams: urlSearchParams.toString(),
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd:
                    `generating ${pathname}?${urlSearchParams.toString()}`,
            },
        });

        return result;
    }

    get refreshRoutes() {
        return this.refresher.routes;
    }

    get generateRoutes() {
        return this.generator.routes;
    }
}

export async function build(config: Config) {
    const frugal = await Frugal.build(config);
    await frugal.build();
    return frugal;
}
