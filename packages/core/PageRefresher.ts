import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PageBuilder, PageBuilderConfig } from './PageBuilder.ts';
import { Page } from './Page.ts';

function logger() {
    return log.getLogger('frugal:PageRefresher');
}

type PageRefresherConfig = PageBuilderConfig;

export class PageRefresher<REQUEST extends object, DATA> {
    private builder: PageBuilder<REQUEST, DATA>;
    private page: Page<REQUEST, DATA>;

    constructor(page: Page<REQUEST, DATA>, config: PageRefresherConfig) {
        this.page = page;
        this.builder = new PageBuilder(page, config);
    }

    get route() {
        return this.page.pattern
    }

    match(pathname: string): boolean {
        return Boolean(this.page.match(pathname));
    }

    async refresh(pathname: string): Promise<void> {
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
                timerStart: `refreshing ${this.page.pattern} as ${pathname}`,
            },
        });

        await this.builder.build(match.params, 'refresh');

        logger().info({
            op: 'done',
            pattern: this.page.pattern,
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `refreshing ${this.page.pattern} as ${pathname}`,
            },
        });
    }
}
