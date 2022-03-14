import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PageBuilder, PageBuilderConfig } from './PageBuilder.ts'
import { Page } from './Page.ts'
import * as pathToRegexp from '../../dep/path-to-regexp.ts';

function logger() {
    return log.getLogger('frugal:PageRegenerator');
}

type PageRegeneratorConfig = PageBuilderConfig


export class PageRegenerator<REQUEST extends object, DATA> {
    private builder: PageBuilder<REQUEST, DATA>
    private page: Page<REQUEST, DATA>
    private urlMatcher: pathToRegexp.MatchFunction<REQUEST>

    constructor(page: Page<REQUEST, DATA>, config: PageRegeneratorConfig) {
        this.page = page
        this.builder = new PageBuilder(page, config)
        this.urlMatcher = pathToRegexp.match(this.page.pattern)
    }

    match(url: string): boolean {
        return Boolean(this.urlMatcher(url))
    }

    async regenerate(url: string): Promise<void> {
        const match = this.urlMatcher(url)
        assert(match !== false)

        logger().info({
            op: 'start',
            pattern: this.page.pattern,
            url,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `regenerate ${this.page.pattern} as ${url}`,
            },
        });

        await this.builder.generate(match.params, 'regenerate')

        logger().info({
            op: 'done',
            pattern: this.page.pattern,
            url,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `regenerate ${this.page.pattern} as ${url}`,
            },
        });
    }

}