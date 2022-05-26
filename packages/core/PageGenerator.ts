import { LoaderContext } from './LoaderContext.ts';
import {
    DynamicPage,
    GenerationRequest,
    Page,
    Phase,
    StaticPage,
} from './Page.ts';
import * as pathUtils from '../../dep/std/path.ts';
import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';

export type PageGeneratorConfig = {
    loaderContext: LoaderContext;
    publicDir: string;
    watch?: boolean;
};

function logger() {
    return log.getLogger('frugal:PageGenerator');
}

type ContentGenerationContext<DATA, PATH> = {
    method: 'POST' | 'GET';
    data: DATA;
    path: PATH;
    phase: Phase;
};

/**
 * Class handling the page generation process.
 */
export class PageGenerator<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> {
    #page: Page<PATH, DATA, BODY>;
    #config: PageGeneratorConfig;

    constructor(
        page: Page<PATH, DATA, BODY>,
        config: PageGeneratorConfig,
    ) {
        this.#page = page;
        this.#config = config;
    }

    /**
     * Generate the page given a request object.
     *
     * Will throw if the request pathname does not match the page pattern.
     */
    async generate(
        request: GenerationRequest<BODY>,
    ): Promise<{ pagePath: string; content: string }> {
        const pathname = new URL(request.url).pathname;
        const match = this.#page.match(pathname);
        assert(match !== false);
        const path = match.params;

        logger().debug({
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `generation of ${this.pattern} as ${this.pathname}`;
            },
        });

        const data = await this.#getData(path, request);

        const result = await this.generateContentFromData(
            pathname,
            {
                data,
                path,
                phase: 'generate',
                method: request.method,
            },
        );

        return result;
    }

    /**
     * Generate the content of a page form its data and path
     */
    async generateContentFromData(
        pathname: string,
        { data, path, phase, method }: ContentGenerationContext<
            DATA,
            PATH
        >,
    ): Promise<{ pagePath: string; content: string }> {
        logger().debug({
            op: 'start',
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart:
                    `content generation of ${this.#page.pattern} as ${pathname}`,
            },
        });

        const content = await this.#page.getContent({
            method,
            phase,
            path,
            data,
            pathname,
            loaderContext: this.#config.loaderContext,
        });

        const pagePath = pathname.endsWith('.html')
            ? pathUtils.join(this.#config.publicDir, pathname)
            : pathUtils.join(this.#config.publicDir, pathname, 'index.html');

        logger().debug({
            op: 'done',
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd:
                    `content generation of ${this.#page.pattern} as ${pathname}`,
            },
        });

        return { pagePath, content };
    }

    async #getData(
        path: PATH,
        request: GenerationRequest<BODY>,
    ) {
        if (request.method === 'GET') {
            if (this.#config.watch && this.#page instanceof StaticPage) {
                return await this.#page.getStaticData({
                    phase: 'build',
                    path,
                });
            }

            assert(
                this.#page instanceof DynamicPage,
                `Can't dynamically generate StaticPage ${this.#page.pattern}`,
            );

            return await this.#page.getDynamicData({
                phase: 'generate',
                path,
                request,
            });
        }

        return await this.#page.postDynamicData({
            phase: 'generate',
            path,
            request,
        });
    }
}
