import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PageBuilder } from './PageBuilder.ts';
import { Page } from './Page.ts';

function logger() {
    return log.getLogger('frugal:PageRefresher');
}

// deno-lint-ignore ban-types
export class PageRefresher<REQUEST extends object, DATA, BODY> {
    private builder: PageBuilder<REQUEST, DATA, BODY>;
    private page: Page<REQUEST, DATA, BODY>;

    constructor(
        page: Page<REQUEST, DATA, BODY>,
        builder: PageBuilder<REQUEST, DATA, BODY>,
    ) {
        this.page = page;
        this.builder = builder;
    }

    match(pathname: string): boolean {
        return Boolean(this.page.match(pathname));
    }

    async refresh(pathname: string): Promise<string> {
        const match = this.page.match(pathname);
        assert(match !== false);
        const request = match.params;

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

        const pagePath = await this.builder.build(request, 'refresh');

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

        return pagePath;
    }
}
