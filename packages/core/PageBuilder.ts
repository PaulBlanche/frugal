import { Page, Phase, StaticPage } from './Page.ts';
import * as mumur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';
import { PageGenerator } from './PageGenerator.ts';
import { assert } from '../../dep/std/asserts.ts';
import { Cache } from './Cache.ts';
import { Persistance } from './Persistance.ts';

export type PageBuilderConfig = {
    persistance: Persistance;
    cache: Cache;
};

function logger() {
    return log.getLogger('frugal:PageBuilder');
}

/**
 * Class handling the page building process (offloading the actual generation to
 * PageGenerator)
 */
export class PageBuilder<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> {
    #generator: PageGenerator<PATH, DATA, BODY>;
    #page: Page<PATH, DATA, BODY>;
    #hash: string;
    #config: PageBuilderConfig;

    constructor(
        page: Page<PATH, DATA, BODY>,
        hash: string,
        generator: PageGenerator<PATH, DATA, BODY>,
        config: PageBuilderConfig,
    ) {
        this.#page = page;
        this.#config = config;
        this.#hash = hash;
        this.#generator = generator;
    }

    /**
     * Build the page for all the path returned by `getPathList`.
     */
    async buildAll() {
        assert(
            this.#page instanceof StaticPage,
            `Can't statically build DynamicPage ${this.#page.pattern}`,
        );

        logger().info({
            op: 'start',
            pattern: this.#page.pattern,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `build all ${this.#page.pattern}`,
            },
        });

        const pathList = await this.#page.getPathList({
            phase: 'build',
        });

        await Promise.all(pathList.map(async (path) => {
            await this.build(path, 'build');
        }));

        logger().info({
            op: 'done',
            pattern: this.#page.pattern,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `build all ${this.#page.pattern}`,
            },
        });
    }

    /**
     * Build the page for a given path and return the output path.
     *
     * The build process id memoized and will be skiped if nothing has changed
     * since the last build.
     */
    async build(path: PATH, phase: Phase): Promise<string> {
        assert(
            this.#page instanceof StaticPage,
            `Can't statically build DynamicPage ${this.#page.pattern}`,
        );
        const url = this.#page.compile(path);

        logger().debug({
            op: 'start',
            pattern: this.#page.pattern,
            url,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `build ${this.#page.pattern} as ${url}`,
            },
        });

        const data = await this.#page.getStaticData({
            phase,
            path,
        });

        const pageInstanceHash = new mumur.Hash()
            .update(JSON.stringify(data))
            .update(url)
            .update(this.#hash)
            .digest();

        return await this.#config.cache.memoize({
            key: pageInstanceHash,
            producer: async () => {
                const { pagePath, content } = await this.#generator
                    .generateContentFromData(url, {
                        method: 'GET',
                        data,
                        path,
                        phase,
                    });

                await this.#config.persistance.set(pagePath, content);

                logger().debug({
                    op: 'done',
                    pattern: this.#page.pattern,
                    url,
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `build ${this.#page.pattern} as ${url}`,
                    },
                });

                return pagePath;
            },
            otherwise: () => {
                logger().debug({
                    op: 'done',
                    pattern: this.#page.pattern,
                    url,
                    msg() {
                        return `${
                            this.logger!.timerEnd
                        } ${this.op} (from cache)`;
                    },
                    logger: {
                        timerEnd: `build ${this.#page.pattern} as ${url}`,
                    },
                });
            },
        });
    }
}
