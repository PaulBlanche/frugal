import { PageContext } from './loader.ts';
import { Cache } from './Cache.ts';
import { Page, Phase } from './Page.ts'
import * as mumur from '../murmur/mod.ts';
import * as pathToRegexp from '../../dep/path-to-regexp.ts';
import * as path from '../../dep/std/path.ts';
import * as fs from '../../dep/std/fs.ts';
import * as log from '../log/mod.ts';

export type PageBuilderConfig = {
    cache: Cache,
    context: PageContext,
    publicDir: string
}

function logger() {
    return log.getLogger('frugal:PageBuilder');
}

export class PageBuilder<REQUEST extends object, DATA> {
    private page: Page<REQUEST, DATA>
    private config: PageBuilderConfig
    private urlCompiler: pathToRegexp.PathFunction<REQUEST>

    constructor(page: Page<REQUEST, DATA>, config: PageBuilderConfig) {
        this.page = page
        this.config = config
        this.urlCompiler = pathToRegexp.compile(this.page.pattern)
    }

    async generateAll() {
        logger().info({
            op: 'start',
            pattern: this.page.pattern,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart: `generate all ${this.page.pattern}`,
            },
        });

        const requestsList = await this.page.getRequestList({
            phase: 'build'
        });

        await Promise.all(requestsList.map(async request => {
            await this.generate(request, 'build')
        }));

        logger().info({
            op: 'done',
            pattern: this.page.pattern,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd: `generate all ${this.page.pattern}`,
            },
        });
    }

    async generate(request: REQUEST, phase: Phase): Promise<void> {
        const url = this.urlCompiler(request);

        logger().debug({
            pattern: this.page.pattern,
            url,
            msg() {
                return `generate ${this.pattern} as ${this.url}`;
            },
        });

        const data = await this.page.getData({
            phase,
            request, 
            cache: this.config.cache 
        });

        const pageInstanceHash = new mumur.Hash()
            .update(JSON.stringify(data))
            .update(this.page.hash)
            .alphabetic();

        await this.config.cache.memoize({
            key: pageInstanceHash,
            producer: async () => {
                logger().debug({
                    pattern: this.page.pattern,
                    url,
                    msg() {
                        return `real generation of ${this.url} (from ${this.pattern})`;
                    },
                });
        
                const content = await this.page.getContent({
                    phase,
                    request,
                    data,
                    url,
                    context: this.config.context,
                    cache: this.config.cache,
                });

                const pagePath = path.join(this.config.publicDir, url);
                await fs.ensureDir(path.dirname(pagePath));

                await Deno.writeTextFile(pagePath, content);
            },
            otherwise: () => {
                logger().debug({
                    pattern: this.page.pattern,
                    url,
                    msg() {
                        return `cache hit for ${this.url} (from ${this.pattern})`;
                    },
                });
            }
        });

    }
}
