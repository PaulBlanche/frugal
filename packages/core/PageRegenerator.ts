import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PageBuilder, PageBuilderConfig } from './PageBuilder.ts';
import { Page } from './Page.ts';

function logger() {
    return log.getLogger('frugal:PageRegenerator');
}

type PageRegeneratorConfig = PageBuilderConfig;

export class PageRegenerator<REQUEST extends object, DATA> {
    private builder: PageBuilder<REQUEST, DATA>;
    private page: Page<REQUEST, DATA>;

    constructor(page: Page<REQUEST, DATA>, config: PageRegeneratorConfig) {
        this.page = page;
        this.builder = new PageBuilder(page, config);
    }

    get route() {
        return this.page.pattern
    }

    match(pathname: string): boolean {
        return Boolean(this.page.match(pathname));
    }

    async regenerate(pathname: string): Promise<void> {
        const match = this.page.match(pathname);
        assert(match !== false);

        logger().info({
            op: 'start',
            pattern: this.page.pattern,
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `regenerate ${this.page.pattern} as ${pathname}`,
            },
        });

        await this.builder.build(match.params, 'regenerate');

        logger().info({
            op: 'done',
            pattern: this.page.pattern,
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `regenerate ${this.page.pattern} as ${pathname}`,
            },
        });
    }
}
