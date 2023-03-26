import * as path from '../../dep/std/path.ts';

import { Phase } from './PageDescriptor.ts';
import { DynamicPage, Page } from './Page.ts';
import { PageGenerator } from './PageGenerator.ts';
import { PathObject } from './PathObject.ts';
import { AssertionError } from '../FrugalError.ts';
import { ResponseCache } from './ResponseCache.ts';
import { log } from '../log.ts';

type PageBuilderConfig<DATA = unknown, PATH extends string = string> = {
    page: Page<DATA, PATH>;
    name: string;
    hash: string;
    generator: PageGenerator<DATA, PATH>;
    cache: ResponseCache;
};

/**
 * Class handling the page building process (offloading the actual generation to
 * PageGenerator)
 */
export class PageBuilder<DATA = unknown, PATH extends string = string> {
    #generator: PageGenerator<DATA, PATH>;
    #name: string;
    #page: Page<DATA, PATH>;
    #hash: string;
    #cache: ResponseCache;

    constructor(
        { page, hash, name, generator, cache }: PageBuilderConfig<DATA, PATH>,
    ) {
        this.#page = page;
        this.#cache = cache;
        this.#hash = hash;
        this.#name = name;
        this.#generator = generator;
    }

    async pathList() {
        if (this.#page instanceof DynamicPage) {
            return [];
        }
        return await this.#page.getPathList({
            phase: 'build',
        });
    }

    /**
     * Build the page for all the path returned by `getPathList`.
     */
    async buildAll() {
        if (this.#page instanceof DynamicPage) {
            throw new AssertionError(
                `Can't statically build DynamicPage ${this.#page.pattern}`,
            );
        }

        const pathList = await this.#page.getPathList({
            phase: 'build',
        });

        await Promise.all(pathList.map(async (path) => {
            await this.build(path, 'build');
        }));
    }

    /**
     * Build the page for a given path and return the output path.
     *
     * The build process id memoized and will be skiped if nothing has changed
     * since the last build.
     */
    async build(buildPath: PathObject<PATH>, phase: Phase): Promise<void> {
        if (this.#page instanceof DynamicPage) {
            throw new AssertionError(
                `Can't statically build DynamicPage ${this.#page.pattern}`,
            );
        }

        const pathname = this.#page.compile(buildPath);

        const response = await this.#page.GET({
            phase,
            path: buildPath,
        });

        response.setRenderer((data) =>
            this.#generator.render(pathname, {
                data,
                path: buildPath,
                phase,
                method: 'GET',
            })
        );

        log(`building path "${pathname}"`, {
            scope: 'PageBuilder',
            kind: 'debug',
        });

        await this.#cache.add(pathname, this.#name, this.#hash, response);
    }
}

export function metadataPath(pagePath: string) {
    return path.join(
        path.dirname(pagePath),
        path.basename(pagePath) + '.metadata',
    );
}
