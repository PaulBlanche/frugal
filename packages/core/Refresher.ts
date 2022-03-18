import * as log from '../log/mod.ts';
import { PageRefresher } from './PageRefresher.ts';
import { CleanConfig } from './Config.ts';
import { FrugalContext } from './FrugalContext.ts';
import { StaticPage } from './Page.ts';

function logger() {
    return log.getLogger('frugal:Refresher');
}

export class Refresher {
    private config: CleanConfig;
    private context: FrugalContext;
    private refreshers: PageRefresher<any, any>[];

    constructor(config: CleanConfig, context: FrugalContext) {
        this.config = config;
        this.context = context;
        this.refreshers = this.context.pages.filter(page => page instanceof StaticPage).map((page) => {
            return new PageRefresher(page, {
                cache: this.context.cache,
                context: this.context.pageContext,
                publicDir: this.config.publicDir,
            });
        });
    }

    get routes() {
        return this.refreshers.map(refresher => refresher.route)
    }

    async refresh(pathname: string): Promise<boolean> {
        this.config.setupServerLogging();

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
            return false;
        }

        await pageRefresher.refresh(pathname);
        await this.context.save();

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

        return true;
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

