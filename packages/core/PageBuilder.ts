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

// deno-lint-ignore ban-types
export class PageBuilder<REQUEST extends object, DATA, POST_BODY> {
    private generator: PageGenerator<REQUEST, DATA, POST_BODY>;
    private page: Page<REQUEST, DATA, POST_BODY>;
    private hash: string;
    private config: PageBuilderConfig;

    constructor(
        page: Page<REQUEST, DATA, POST_BODY>,
        hash: string,
        generator: PageGenerator<REQUEST, DATA, POST_BODY>,
        config: PageBuilderConfig,
    ) {
        this.page = page;
        this.config = config;
        this.hash = hash;
        this.generator = generator;
    }

    async buildAll() {
        assert(
            this.page instanceof StaticPage,
            `Can't statically build DynamicPage ${this.page.pattern}`,
        );

        logger().info({
            op: 'start',
            pattern: this.page.pattern,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `build all ${this.page.pattern}`,
            },
        });

        const requestsList = await this.page.getRequestList({
            phase: 'build',
        });

        await Promise.all(requestsList.map(async (request) => {
            await this.build(request, 'build');
        }));

        logger().info({
            op: 'done',
            pattern: this.page.pattern,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `build all ${this.page.pattern}`,
            },
        });
    }

    async build(request: REQUEST, phase: Phase): Promise<string> {
        assert(
            this.page instanceof StaticPage,
            `Can't statically build DynamicPage ${this.page.pattern}`,
        );
        const url = this.page.compile(request);

        logger().debug({
            op: 'start',
            pattern: this.page.pattern,
            url,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `build ${this.page.pattern} as ${url}`,
            },
        });

        const data = await this.page.getStaticData({
            phase,
            request,
        });

        const pageInstanceHash = new mumur.Hash()
            .update(JSON.stringify(data))
            .update(url)
            .update(this.hash)
            .alphabetic();

        return await this.config.cache.memoize({
            key: pageInstanceHash,
            producer: async () => {
                const { pagePath, content } = await this.generator
                    .generateContentFromData(url, {
                        method: 'GET',
                        data,
                        request,
                        phase,
                    });

                console.log(pagePath);
                await this.config.persistance.set(pagePath, content);

                logger().debug({
                    op: 'done',
                    pattern: this.page.pattern,
                    url,
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `build ${this.page.pattern} as ${url}`,
                    },
                });

                return pagePath;
            },
            otherwise: () => {
                logger().debug({
                    op: 'done',
                    pattern: this.page.pattern,
                    url,
                    msg() {
                        return `${
                            this.logger!.timerEnd
                        } ${this.op} (from cache)`;
                    },
                    logger: {
                        timerEnd: `build ${this.page.pattern} as ${url}`,
                    },
                });
            },
        });
    }
}
