import { PageBuilder } from './PageBuilder.ts';
import { Page } from './Page.ts';
import { AssertionError } from '../FrugalError.ts';

type PageRefresherConfig<DATA = unknown, PATH extends string = string> = {
    page: Page<DATA, PATH>;
    builder: PageBuilder<DATA, PATH>;
};

/**
 * Class handling the page refreshing process (offloading the actual building to
 * PageBuilder)
 */
export class PageRefresher<DATA = unknown, PATH extends string = string> {
    #builder: PageBuilder<DATA, PATH>;
    #page: Page<DATA, PATH>;

    constructor({ page, builder }: PageRefresherConfig<DATA, PATH>) {
        this.#page = page;
        this.#builder = builder;
    }

    /**
     * Refresh the page for a given matching pathname.
     *
     * The build process id memoized and will be skiped if nothing has changed
     * since the last build.
     */
    async refresh(pathname: string): Promise<void> {
        const match = this.#page.match(pathname);

        if (match === false) {
            throw new AssertionError(
                `pathname "${pathname} did not match pattern "${this.#page.pattern}"`,
            );
        }

        const request = match.params;

        await this.#builder.build(request, 'refresh');
    }
}
