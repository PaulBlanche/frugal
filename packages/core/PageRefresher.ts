import * as log from '../log/mod.ts';
import { assert } from '../../dep/std/asserts.ts';
import { PageBuilder } from './PageBuilder.ts';
import { Page } from './Page.ts';

function logger() {
    return log.getLogger('frugal:PageRefresher');
}

/**
 * Class handling the page refreshing process (offloading the actual building to
 * PageBuilder)
 */
export class PageRefresher<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> {
    #builder: PageBuilder<PATH, DATA, BODY>;
    #page: Page<PATH, DATA, BODY>;

    constructor(
        page: Page<PATH, DATA, BODY>,
        builder: PageBuilder<PATH, DATA, BODY>,
    ) {
        this.#page = page;
        this.#builder = builder;
    }

    /**
     * Refresh the page for a given matching pathname.
     *
     * The build process id memoized and will be skiped if nothing has changed
     * since the last build.
     */
    async refresh(pathname: string): Promise<string> {
        const match = this.#page.match(pathname);
        assert(match !== false);
        const request = match.params;

        logger().info({
            op: 'start',
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `refreshing ${this.#page.pattern} as ${pathname}`,
            },
        });

        const pagePath = await this.#builder.build(request, 'refresh');

        logger().info({
            op: 'done',
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `refreshing ${this.#page.pattern} as ${pathname}`,
            },
        });

        return pagePath;
    }
}
