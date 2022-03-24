import { LoaderContext } from './LoaderContext.ts';
import { DynamicPage, Page, Phase } from './Page.ts';
import * as path from '../../dep/std/path.ts';
import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';

export type PageGeneratorConfig = {
    loaderContext: LoaderContext;
    publicDir: string;
};

function logger() {
    return log.getLogger('frugal:PageGenerator');
}

export class PageGenerator<REQUEST extends object, DATA> {
    private page: Page<REQUEST, DATA>;
    private config: PageGeneratorConfig;

    constructor(page: Page<REQUEST, DATA>, config: PageGeneratorConfig) {
        this.page = page;
        this.config = config;
    }

    get route() {
        return this.page.pattern;
    }

    match(url: string): boolean {
        return Boolean(this.page.match(url));
    }

    async generate(
        pathname: string,
        searchParams: URLSearchParams,
    ): Promise<{ pagePath: string; content: string }> {
        assert(
            this.page instanceof DynamicPage,
            `Can't dynamically generate StaticPage ${this.page.pattern}`,
        );

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

        const data = await this.page.getDynamicData({
            phase: 'generate',
            request,
            searchParams,
        });

        const result = await this.generateContentFromData(
            pathname,
            data,
            request,
            'generate',
        );

        return result;
    }

    async generateContentFromData(
        pathname: string,
        data: DATA,
        request: REQUEST,
        phase: Phase,
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
            phase,
            request,
            data,
            pathname,
            loaderContext: this.config.loaderContext,
        });

        const pagePath = path.join(this.config.publicDir, pathname);

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
