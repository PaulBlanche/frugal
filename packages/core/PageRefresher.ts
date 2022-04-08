import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PageBuilder } from './PageBuilder.ts';
import { Page } from './Page.ts';

function logger() {
    return log.getLogger('frugal:PageRefresher');
}

export class PageRefresher<REQUEST extends object, DATA, POST_BODY> {
    private builder: PageBuilder<REQUEST, DATA, POST_BODY>;
    private page: Page<REQUEST, DATA, POST_BODY>;

    constructor(
        page: Page<REQUEST, DATA, POST_BODY>,
        builder: PageBuilder<REQUEST, DATA, POST_BODY>,
    ) {
        this.page = page;
        this.builder = builder;
    }

    get route(): { pattern: string; post: boolean; get: boolean } {
        return {
            pattern: this.page.pattern,
            post: false,
            get: true,
        };
    }

    match(pathname: string): boolean {
        return Boolean(this.page.match(pathname));
    }

    async refresh(pathname: string): Promise<string> {
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

        const pagePath = await this.builder.build(match.params, 'refresh');

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
