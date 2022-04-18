import { LoaderContext } from './LoaderContext.ts';
import { DynamicPage, Page, Phase, StaticPage } from './Page.ts';
import * as path from '../../dep/std/path.ts';
import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';

export type PageGeneratorConfig = {
    loaderContext: LoaderContext;
    publicDir: string;
    devMode?: boolean;
};

function logger() {
    return log.getLogger('frugal:PageGenerator');
}

export type GenerationContext<POST_BODY> =
    & { searchParams: URLSearchParams }
    & ({
        method: 'GET';
    } | { method: 'POST'; body: POST_BODY });

type ContentGenerationContext<DATA, REQUEST> = {
    method: 'POST' | 'GET';
    data: DATA;
    request: REQUEST;
    phase: Phase;
};
// deno-lint-ignore ban-types
export class PageGenerator<REQUEST extends object, DATA, POST_BODY> {
    private page: Page<REQUEST, DATA, POST_BODY>;
    private config: PageGeneratorConfig;

    constructor(
        page: Page<REQUEST, DATA, POST_BODY>,
        config: PageGeneratorConfig,
    ) {
        this.page = page;
        this.config = config;
    }

    match(url: string): boolean {
        return Boolean(this.page.match(url));
    }

    async generate(
        pathname: string,
        context: GenerationContext<POST_BODY>,
    ): Promise<{ pagePath: string; content: string }> {
        const match = this.page.match(pathname);
        assert(match !== false);
        const request = match.params;

        logger().debug({
            pattern: this.page.pattern,
            pathname,
            msg() {
                return `generation of ${this.pattern} as ${this.pathname}`;
            },
        });

        const data = await this._getData(request, context);

        const result = await this.generateContentFromData(
            pathname,
            { data, request, phase: 'generate', method: context.method },
        );

        return result;
    }

    private async _getData(
        request: REQUEST,
        context: GenerationContext<POST_BODY>,
    ) {
        if (context.method === 'GET') {
            if (this.config.devMode && this.page instanceof StaticPage) {
                return await this.page.getStaticData({
                    phase: 'build',
                    request,
                });
            }

            assert(
                this.page instanceof DynamicPage,
                `Can't dynamically generate StaticPage ${this.page.pattern}`,
            );

            return await this.page.getDynamicData({
                phase: 'generate',
                request,
                searchParams: context.searchParams,
            });
        }

        return await this.page.postDynamicData({
            phase: 'generate',
            request,
            searchParams: context.searchParams,
            body: context.body,
        });
    }

    async generateContentFromData(
        pathname: string,
        { data, request, phase, method }: ContentGenerationContext<
            DATA,
            REQUEST
        >,
    ): Promise<{ pagePath: string; content: string }> {
        logger().debug({
            op: 'start',
            pattern: this.page.pattern,
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart:
                    `content generation of ${this.page.pattern} as ${pathname}`,
            },
        });

        const content = await this.page.getContent({
            method,
            phase,
            request,
            data,
            pathname,
            loaderContext: this.config.loaderContext,
        });

        const pagePath = pathname.endsWith('.html')
            ? path.join(this.config.publicDir, pathname)
            : path.join(this.config.publicDir, pathname, 'index.html');

        logger().debug({
            op: 'done',
            pattern: this.page.pattern,
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd:
                    `content generation of ${this.page.pattern} as ${pathname}`,
            },
        });

        return { pagePath, content };
    }
}
