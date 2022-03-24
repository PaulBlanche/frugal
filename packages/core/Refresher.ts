import * as log from '../log/mod.ts';
import { PageRefresher } from './PageRefresher.ts';
import { CleanConfig } from './Config.ts';

function logger() {
    return log.getLogger('frugal:Refresher');
}

export class Refresher {
    private config: CleanConfig;
    private refreshers: PageRefresher<any, any>[];

    constructor(config: CleanConfig, refreshers: PageRefresher<any, any>[]) {
        this.config = config;
        this.refreshers = refreshers; /*this.context.pages.filter((page) =>
            page instanceof StaticPage
        ).map((page) => {
            return new PageRefresher(page, {
                cache: this.context.cache,
                loaderContext: this.context.loaderContext,
                publicDir: this.config.publicDir,
            });
        });*/
    }

    get routes() {
        return this.refreshers.map((refresher) => refresher.route);
    }

    async refresh(pathname: string): Promise<string | undefined> {
        await this.config.setupServerLogging();

        logger().info({
            op: 'start',
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `refresh of ${pathname}`,
            },
        });

        const pageRefresher = this.getMatchingPageRefresher(
            pathname,
        );

        if (pageRefresher === undefined) {
            logger().info({
                pathname,
                msg() {
                    return `no match found for ${this.pathname}`;
                },
                logger: {
                    timerEnd: `refresh of ${pathname}`,
                },
            });
            return undefined;
        }

        const pagePath = await pageRefresher.refresh(pathname);

        logger().info({
            op: 'done',
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `refresh of ${pathname}`,
            },
        });

        return pagePath;
    }

    private getMatchingPageRefresher(
        pathname: string,
    ): PageRefresher<any, any> | undefined {
        for (const pageRefresher of this.refreshers) {
            if (pageRefresher.match(pathname)) {
                return pageRefresher;
            }
        }

        return undefined;
    }
}
