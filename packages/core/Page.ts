import * as pathToRegexp from '../../dep/path-to-regexp.ts';

import {
    DataResult,
    DynamicDataContext,
    DynamicPageDescriptor,
    GetContentContext,
    GetPathListParams,
    PageDescriptor,
    parseDynamicDescriptor,
    parseStaticDescriptor,
    StaticDataContext,
    StaticPageDescriptor,
} from './PageDescriptor.ts';
import { FrugalError } from './FrugalError.ts';
import { PathObject } from './PathObject.ts';

class BasePage<
    DATA = unknown,
    PATH extends string = string,
    DESCRIPTOR extends PageDescriptor<DATA, PATH> = PageDescriptor<DATA, PATH>,
> {
    #descriptor: DESCRIPTOR;
    #urlCompiler: pathToRegexp.PathFunction<PathObject<PATH>>;
    #urlMatcher: pathToRegexp.MatchFunction<PathObject<PATH>>;

    constructor(
        descriptor: DESCRIPTOR,
    ) {
        this.#descriptor = descriptor;
        this.#urlCompiler = pathToRegexp.compile(this.#descriptor.pattern);
        this.#urlMatcher = pathToRegexp.match(this.#descriptor.pattern);
    }

    get pattern() {
        return this.#descriptor.pattern;
    }

    get self() {
        return this.#descriptor.self;
    }

    get POST() {
        return this.#descriptor.POST;
    }

    get PUT() {
        return this.#descriptor.PUT;
    }

    get PATCH() {
        return this.#descriptor.PATCH;
    }

    get DELETE() {
        return this.#descriptor.DELETE;
    }

    get OPTIONS() {
        return this.#descriptor.OPTIONS;
    }

    getContent(context: GetContentContext<DATA, PATH>) {
        return this.#descriptor.getContent(context);
    }

    compile(path: PathObject<PATH>) {
        try {
            return this.#urlCompiler(path);
        } catch (error: unknown) {
            throw new PageDescriptorError(
                `Error while compiling pattern "${this.pattern}" with path "${
                    JSON.stringify(path)
                }"`,
                { page: this, cause: error },
            );
        }
    }

    match(path: string) {
        return this.#urlMatcher(path);
    }
}

export class DynamicPage<
    DATA = unknown,
    PATH extends string = string,
    DESCRIPTOR extends DynamicPageDescriptor<DATA, PATH> =
        DynamicPageDescriptor<DATA, PATH>,
> extends BasePage<DATA, PATH, DESCRIPTOR> {
    #descriptor: DESCRIPTOR;

    constructor(descriptor: DESCRIPTOR) {
        super(descriptor);
        this.#descriptor = descriptor;
    }

    GET(context: DynamicDataContext<PATH>) {
        if (this.#descriptor.GET === undefined) {
            return { data: {} } as DataResult<DATA>;
        }

        return this.#descriptor.GET(context);
    }
}

export class StaticPage<
    DATA = unknown,
    PATH extends string = string,
    DESCRIPTOR extends StaticPageDescriptor<DATA, PATH> = StaticPageDescriptor<
        DATA,
        PATH
    >,
> extends BasePage<DATA, PATH, DESCRIPTOR> {
    #descriptor: StaticPageDescriptor<DATA, PATH>;

    constructor(
        descriptor: DESCRIPTOR,
    ) {
        super(descriptor);
        this.#descriptor = descriptor;
    }

    GET(context: StaticDataContext<PATH>) {
        if (this.#descriptor.GET === undefined) {
            return { data: {} } as DataResult<DATA>;
        }
        return this.#descriptor.GET(context);
    }

    getPathList(params: GetPathListParams) {
        if (this.#descriptor.getPathList === undefined) {
            return [{} as PATH];
        }
        return this.#descriptor.getPathList(params);
    }
}

export class PageDescriptorError extends FrugalError {
    // deno-lint-ignore no-explicit-any
    page: BasePage<any, any, any>;

    constructor(
        message: string,
        // deno-lint-ignore no-explicit-any
        options: ErrorOptions & { page: BasePage<any, any, any> },
    ) {
        super(message, options);
        this.page = options.page;
    }
}

export type Page<
    DATA = unknown,
    PATH extends string = string,
> =
    | StaticPage<DATA, PATH>
    | DynamicPage<DATA, PATH>;

/**
 * Build a page object from a page descriptor
 */
export function page<
    DATA = unknown,
    PATH extends string = string,
>(descriptor: PageDescriptor<DATA, PATH>): Page {
    if (
        typeof descriptor === 'object' &&
        descriptor !== null &&
        'type' in descriptor && descriptor.type === 'dynamic'
    ) {
        const result = parseDynamicDescriptor<DATA, PATH>(descriptor);
        if (result.success) {
            return new DynamicPage<DATA, PATH>(descriptor) as unknown as Page;
        } else {
            throw new FrugalError(
                `Error while parsing descriptor "${
                    descriptor.pattern ?? descriptor.self.href ?? 'unknown'
                }"`,
                {
                    cause: result.error,
                },
            );
        }
    }

    const result = parseStaticDescriptor(descriptor);
    if (result.success) {
        return new StaticPage<DATA, PATH>(descriptor) as unknown as Page;
    } else {
        throw new FrugalError(
            `Error while parsing descriptor "${
                descriptor.pattern ?? descriptor.self.href ?? 'unknown'
            }"`,
            {
                cause: result.error,
            },
        );
    }
}
