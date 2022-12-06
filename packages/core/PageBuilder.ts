import * as path from '../../dep/std/path.ts';
import { assert } from '../../dep/std/testing/asserts.ts';

import * as mumur from '../murmur/mod.ts';
import * as log from '../log/mod.ts';

import { Phase } from './PageDescriptor.ts';
import { Page, StaticPage } from './Page.ts';
import { PageGenerator } from './PageGenerator.ts';
import { Cache } from './Cache.ts';
import { Persistence } from './Persistence.ts';
import { PathObject } from './PathObject.ts';

export type PageBuilderConfig = {
    persistence: Persistence;
    cache: Cache;
};

function logger() {
    return log.getLogger('frugal:PageBuilder');
}

/**
 * Class handling the page building process (offloading the actual generation to
 * PageGenerator)
 */
export class PageBuilder<DATA = unknown, PATH extends string = string> {
    #generator: PageGenerator<DATA, PATH>;
    #page: Page<DATA, PATH>;
    #hash: string;
    #config: PageBuilderConfig;

    constructor(
        page: Page<DATA, PATH>,
        hash: string,
        generator: PageGenerator<DATA, PATH>,
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
    async build(buildPath: PathObject<PATH>, phase: Phase): Promise<string> {
        assert(
            this.#page instanceof StaticPage,
            `Can't statically build DynamicPage ${this.#page.pattern}`,
        );
        const pathname = this.#page.compile(buildPath);

        logger().debug({
            op: 'start',
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `build ${this.#page.pattern} as ${pathname}`,
            },
        });

        const result = await this.#page.GET({
            phase,
            path: buildPath,
        });

        const pageInstanceHash = new mumur.Hash()
            .update(JSON.stringify(result) ?? '')
            .update(pathname)
            .update(this.#hash)
            .digest();

        return await this.#config.cache.memoize({
            key: pageInstanceHash,
            producer: async () => {
                const pagePath = this.#generator.getPagePath(pathname);

                if ('status' in result) {
                    const headers = new Headers(result.headers);

                    if ('location' in result) {
                        headers.set('location', String(result.location));
                    }

                    const serializedHeaders = Array.from(headers.entries());

                    await Promise.all([
                        this.#config.persistence.set(
                            metadataPath(pagePath),
                            JSON.stringify({
                                headers: serializedHeaders,
                                status: result.status,
                            }),
                        ),
                    ]);

                    return pagePath;
                }

                const content = await this.#generator
                    .generateContentFromData(pathname, {
                        method: 'GET',
                        data: result.data ?? {} as DATA,
                        path: buildPath,
                        phase,
                    });

                const serializedHeaders = Array.from(
                    new Headers(result.headers).entries(),
                );
                const hasHeaders = serializedHeaders.length > 0;

                await Promise.all([
                    this.#config.persistence.set(
                        pagePath,
                        content,
                    ),
                    hasHeaders && this.#config.persistence.set(
                        metadataPath(pagePath),
                        JSON.stringify({ headers: serializedHeaders }),
                    ),
                ]);

                logger().debug({
                    op: 'done',
                    pattern: this.#page.pattern,
                    pathname,
                    msg() {
                        return `${this.logger!.timerEnd} ${this.op}`;
                    },
                    logger: {
                        timerEnd: `build ${this.#page.pattern} as ${pathname}`,
                    },
                });

                return pagePath;
            },
            otherwise: () => {
                logger().debug({
                    op: 'done',
                    pattern: this.#page.pattern,
                    pathname,
                    msg() {
                        return `${
                            this.logger!.timerEnd
                        } ${this.op} (from cache)`;
                    },
                    logger: {
                        timerEnd: `build ${this.#page.pattern} as ${pathname}`,
                    },
                });
            },
        });
    }
}

export function metadataPath(pagePath: string) {
    return path.join(
        path.dirname(pagePath),
        path.basename(pagePath) + '.metadata',
    );
}
