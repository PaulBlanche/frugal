import { assert } from '../../dep/std/testing/asserts.ts';
import * as pathUtils from '../../dep/std/path.ts';
import * as http from '../../dep/std/http.ts';

import { Generated } from '../loader_script/ScriptLoader.ts';
import * as log from '../log/mod.ts';

import { LoaderContext } from './LoaderContext.ts';
import { DynamicDataContext, Phase } from './PageDescriptor.ts';
import { Page, StaticPage } from './Page.ts';
import { PathObject } from './PathObject.ts';
import { FrugalError } from './FrugalError.ts';

export type PageGeneratorConfig = {
    loaderContext: LoaderContext;
    publicDir: string;
    rootDir: string;
    watch?: boolean;
};

function logger() {
    return log.getLogger('frugal:PageGenerator');
}

type ContentGenerationContext<DATA = unknown, PATH extends string = string> = {
    method: string;
    data: DATA;
    path: PathObject<PATH>;
    phase: Phase;
};

type GenerationResult =
    | { pagePath: string; content: string; headers: Headers }
    | { status: http.Status; headers: Headers }
    | Response;

/**
 * Class handling the page generation process.
 */
export class PageGenerator<DATA = unknown, PATH extends string = string> {
    #page: Page<DATA, PATH>;
    #config: PageGeneratorConfig;

    constructor(page: Page<DATA, PATH>, config: PageGeneratorConfig) {
        this.#page = page;
        this.#config = config;
    }

    /**
     * Generate the page given a request object.
     *
     * Will throw if the request pathname does not match the page pattern.
     */
    async generate(
        request: Request,
        state: Record<string, unknown>,
    ): Promise<GenerationResult> {
        const pathname = new URL(request.url).pathname;
        const match = this.#page.match(pathname);
        assert(match !== false);
        const path = match.params;

        logger().debug({
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `generation of ${this.pattern} as ${this.pathname}`;
            },
        });

        const result = await this.#getData({
            phase: 'generate',
            request,
            path,
            state,
        });

        if (result instanceof Response) {
            return result;
        }

        if ('status' in result) {
            const headers = new Headers(result.headers);

            if ('location' in result) {
                headers.set('location', String(result.location));
            }

            return {
                status: result.status,
                headers,
            };
        }

        const pagePath = this.getPagePath(pathname);
        const content = await this.generateContentFromData(
            pathname,
            {
                data: result.data ?? {} as DATA,
                path,
                phase: 'generate',
                method: request.method,
            },
        );

        return { pagePath, content, headers: new Headers(result.headers) };
    }

    /**
     * Generate the content of a page form its data and path
     */
    async generateContentFromData(
        pathname: string,
        { data, path, phase, method }: ContentGenerationContext<DATA, PATH>,
    ): Promise<string> {
        logger().debug({
            op: 'start',
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `${this.op} ${this.logger!.timerStart}`;
            },
            logger: {
                timerStart:
                    `content generation of ${this.#page.pattern} as ${pathname}`,
            },
        });

        const descriptor = pathUtils.relative(
            this.#config.rootDir,
            this.#page.self.pathname,
        );

        const content = await this.#page.getContent({
            method,
            phase,
            path,
            data,
            pathname,
            descriptor,
            loaderContext: this.#config.loaderContext,
        });

        logger().debug({
            op: 'done',
            pattern: this.#page.pattern,
            pathname,
            msg() {
                return `${this.logger!.timerEnd} ${this.op}`;
            },
            logger: {
                timerEnd:
                    `content generation of ${this.#page.pattern} as ${pathname}`,
            },
        });

        if (!this.#config.watch) {
            return content;
        } else {
            const injectWatchScript = this.#config.loaderContext.get<Generated>(
                'inject-watch-script',
            );
            if (injectWatchScript) {
                // browsers are very forgiving, we can simply add the watch
                // script after the whole document
                return `${content}<script>var script = document.createElement('script'); script.type="module"; script.src="${
                    injectWatchScript[
                        pathUtils.relative(
                            this.#config.rootDir,
                            this.#page.self.pathname,
                        )
                    ][
                        'inject-watch-script'
                    ]
                }"; document.head.appendChild(script);</script>`;
            } else {
                return content;
            }
        }
    }

    getPagePath(pathname: string) {
        return pathname.endsWith('.html')
            ? pathUtils.join(this.#config.publicDir, pathname)
            : pathUtils.join(this.#config.publicDir, pathname, 'index.html');
    }

    #getData(context: DynamicDataContext<PATH>) {
        if (!(context.request.method in this.#page)) {
            throw new FrugalError(
                `Page ${this.#page.pattern} cannot handle ${context.request.method} requests`,
            );
        }

        if (this.#page instanceof StaticPage) {
            if (context.request.method === 'GET') {
                if (!this.#config.watch) {
                    throw new FrugalError(
                        `Can't dynamically generate StaticPage ${this.#page.pattern} for GET method`,
                    );
                }
                return this.#page.GET(context);
            }
        }

        // need to index this.#page with a string
        // deno-lint-ignore no-explicit-any
        return (this.#page as any)[context.request.method](context);
    }
}
