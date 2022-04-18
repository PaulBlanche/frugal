import { CleanConfig, Config } from './Config.ts';
import { Builder } from './Builder.ts';
import { Refresher } from './Refresher.ts';
import { Generator } from './Generator.ts';
import { LoaderContext } from './LoaderContext.ts';
import { DynamicPage, StaticPage } from './Page.ts';
import { PageBuilder } from './PageBuilder.ts';
import { PageRefresher } from './PageRefresher.ts';
import { GenerationContext, PageGenerator } from './PageGenerator.ts';
import * as log from '../log/mod.ts';
import * as path from '../../dep/std/path.ts';
import { assert } from '../../dep/std/asserts.ts';
import { DependencyTree, ModuleList } from './DependencyTree.ts';
import { FilesystemPersistance } from './Persistance.ts';
import { PersistantCache } from './Cache.ts';

function logger() {
    return log.getLogger('frugal:Frugal');
}

const PAGE_CACHE_FILENAME = 'pages.json';
const MODULES_FILENAME = 'modules.json';
const LOADER_CONTEXT_FILENAME = 'loader_context.json';

export class Frugal {
    private builder: Builder;
    private refresher: Refresher;
    private generator: Generator;
    config: CleanConfig;
    private moduleList: ModuleList;
    private cache: PersistantCache;
    private loaderContext: LoaderContext;
    routes: {
        [pattern: string]: {
            type: 'static';
            // deno-lint-ignore no-explicit-any
            page: StaticPage<any, any, any>;
            // deno-lint-ignore no-explicit-any
            builder: PageBuilder<any, any, any>;
            // deno-lint-ignore no-explicit-any
            refresher: PageRefresher<any, any, any>;
            // deno-lint-ignore no-explicit-any
            generator: PageGenerator<any, any, any>;
        } | {
            type: 'dynamic';
            // deno-lint-ignore no-explicit-any
            page: DynamicPage<any, any, any>;
            // deno-lint-ignore no-explicit-any
            generator: PageGenerator<any, any, any>;
        };
    };

    static async build(config: Config) {
        const cleanConfig = await CleanConfig.load(config);
        await log.setup(cleanConfig.loggingConfig);

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'building frugal context',
            },
        });

        const dependencyTree = await DependencyTree.build(
            cleanConfig.pages.map((page) => page.self),
            {
                resolve: cleanConfig.resolve,
            },
        );
        const cache = await PersistantCache.load(
            cleanConfig.cachePersistance,
            path.resolve(cleanConfig.cacheDir, PAGE_CACHE_FILENAME),
        );
        const assets = dependencyTree.gather(cleanConfig.loaders);
        const loaderContext = await LoaderContext.build(
            cleanConfig,
            assets,
            (name) => {
                return PersistantCache.load(
                    new FilesystemPersistance(),
                    path.resolve(
                        cleanConfig.cacheDir,
                        'loader',
                        `${name}.json`,
                    ),
                );
            },
        );

        const frugal = new Frugal(
            cleanConfig,
            dependencyTree.moduleList(),
            cache,
            loaderContext,
        );

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

    static async load(config: Config) {
        const cleanConfig = await CleanConfig.load(config);
        await log.setup(cleanConfig.loggingConfig);

        logger().info({
            op: 'start',
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: 'loading frugal context',
            },
        });

        const moduleList = await ModuleList.load(
            path.resolve(cleanConfig.cacheDir, MODULES_FILENAME),
        );
        const cache = await PersistantCache.load(
            cleanConfig.cachePersistance,
            path.resolve(cleanConfig.cacheDir, PAGE_CACHE_FILENAME),
        );
        const loaderContext = await LoaderContext.load(
            path.resolve(cleanConfig.cacheDir, LOADER_CONTEXT_FILENAME),
        );

        const frugal = new Frugal(
            cleanConfig,
            moduleList,
            cache,
            loaderContext,
        );

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

    constructor(
        config: CleanConfig,
        moduleList: ModuleList,
        cache: PersistantCache,
        loaderContext: LoaderContext,
    ) {
        this.routes = {};

        const dynamicPages = config.pages.filter((
            page,
            // deno-lint-ignore no-explicit-any
        ): page is DynamicPage<any, any, any> => page instanceof DynamicPage);

        const generators = dynamicPages.map((page) => {
            const generator = new PageGenerator(page, {
                loaderContext,
                publicDir: config.publicDir,
            });

            assert(!(page.pattern in this.routes));
            this.routes[page.pattern] = { type: 'dynamic', page, generator };

            return generator;
        });

        const staticPages = config.pages.filter((
            page,
            // deno-lint-ignore no-explicit-any
        ): page is StaticPage<any, any, any> => page instanceof StaticPage);

        const { refreshers, builders } = staticPages.reduce(
            (accumulator, page) => {
                const generator = new PageGenerator(page, {
                    loaderContext,
                    publicDir: config.publicDir,
                    devMode: config.devMode,
                });

                generators.push(generator);

                const module = moduleList.get(page.self);
                const pageHash = module?.moduleHash ?? String(Math.random());

                const builder = new PageBuilder(page, pageHash, generator, {
                    cache,
                    persistance: config.pagePersistance,
                });

                const refresher = new PageRefresher(
                    page,
                    builder,
                );

                accumulator.builders.push(builder);
                accumulator.refreshers.push(refresher);

                assert(!(page.pattern in this.routes));
                this.routes[page.pattern] = {
                    type: 'static',
                    page,
                    generator,
                    builder,
                    refresher,
                };

                return accumulator;
            },
            { builders: [], refreshers: [] } as {
                // deno-lint-ignore no-explicit-any
                builders: PageBuilder<any, any, any>[];
                // deno-lint-ignore no-explicit-any
                refreshers: PageRefresher<any, any, any>[];
            },
        );

        this.generator = new Generator(config, generators);
        this.builder = new Builder(config, builders);
        this.refresher = new Refresher(config, refreshers);
        this.config = config;
        this.moduleList = moduleList;
        this.cache = cache;
        this.loaderContext = loaderContext;
    }

    async save(options: { runtime?: boolean } = {}) {
        if (options.runtime !== true) {
            await this.moduleList.save(
                path.resolve(this.config.cacheDir, MODULES_FILENAME),
            );
            await this.loaderContext.save(
                path.resolve(this.config.cacheDir, LOADER_CONTEXT_FILENAME),
            );
        }
        await this.cache.save();
    }

    // build all registered static pages
    async build() {
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
        await this.save();

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
        await this.save({ runtime: true });

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
    async generate(pathname: string, context: GenerationContext<unknown>) {
        logger().info({
            op: 'start',
            pathname,
            context,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart:
                    `generating ${context.method} ${pathname}?${context.searchParams.toString()}`,
            },
        });

        const result = await this.generator.generate(pathname, context);
        await this.save({ runtime: true });

        logger().info({
            op: 'done',
            pathname,
            context,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd:
                    `generating ${context.method} ${pathname}?${context.searchParams.toString()}`,
            },
        });

        return result;
    }

    async clean({ justCache = false }: { justCache?: boolean } = {}) {
        if (justCache) {
            await Deno.remove(this.config.cacheDir, { recursive: true });
        }
        await Deno.remove(this.config.outputDir, { recursive: true });
    }
}

export async function build(config: Config) {
    const frugal = await Frugal.build(config);
    await frugal.build();
    return frugal;
}
