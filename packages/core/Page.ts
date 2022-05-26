import { LoaderContext } from './LoaderContext.ts';
import { assert } from '../../dep/std/asserts.ts';
import * as pathToRegexp from '../../dep/path-to-regexp.ts';
import { FrugalError } from './FrugalError.ts';

/**
 * The different phases of Frugal.
 *
 * A page descriptor method can be called in a build phase (during the Frugal
 * instance build), during the refresh phase (at runtime in a refresh call) or
 * during the generate phase (at runtime in a generate call).
 */
export type Phase = 'build' | 'refresh' | 'generate';

export type GenerationRequest<BODY = unknown> = {
    method: 'POST' | 'GET';
    url: URL;
    body: BODY;
    headers: Headers;
};

export type GetPathListParams = {
    /** The current phase (build, refresh or generate) */
    phase: Phase;
};

export type GetStaticDataParams<
    PATH extends Record<string, string> = Record<string, string>,
> = {
    /** The current phase (build, refresh or generate) */
    phase: Phase;
    /** The path for which we need the data */
    path: PATH;
};

export type GetDynamicDataParams<
    PATH extends Record<string, string> = Record<string, string>,
    BODY = unknown,
> = {
    /** The current phase (build, refresh or generate) */
    phase: 'generate';
    /** The path for which we need the data */
    path: PATH;
    /** The underlying request that triggered the getDynamicData */
    request: GenerationRequest<BODY>;
};

export type PostDynamicDataParams<
    PATH extends Record<string, string> = Record<string, string>,
    BODY = unknown,
> = {
    /** The current phase (build, refresh or generate) */
    phase: 'generate';
    /** The path for which we need the data */
    path: PATH;
    /** The underlying request that triggered the postDynamicData */
    request: GenerationRequest<BODY>;
};

export type GetContentParams<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
> = {
    method: 'POST' | 'GET';
    /** The current phase (build, refresh or generate) */
    phase: Phase;
    /** The path for which we need the content */
    path: PATH;
    /** The data for which we need the content */
    data: DATA;
    /** The pathname of the page */
    pathname: string;
    /** The URL of the entrypoint (to access data related to this entrypoint on
     * `loaderContext`) */
    entrypoint: URL;
    loaderContext: LoaderContext;
};

/**
 * Method returning the list of all path for this static page that frugal needs
 * to build
 */
export type GetPathList<
    PATH extends Record<string, string> = Record<string, string>,
> = (
    params: GetPathListParams,
) => Promise<PATH[]> | PATH[];

/**
 * Method returning the data for a given path for a static page
 */
export type GetStaticData<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
> = (
    params: GetStaticDataParams<PATH>,
) => Promise<DATA> | DATA;

/**
 * Method returning the data for a given path and GET request for a dynamic page
 */
export type GetDynamicData<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> = (
    params: GetDynamicDataParams<PATH, BODY>,
) => Promise<DATA> | DATA;

/**
 * Method returning the data for a given path and POST request (for both static
 * and dynamic pages)
 */
export type PostDynamicData<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> = (
    params: PostDynamicDataParams<PATH, BODY>,
) => Promise<DATA> | DATA;

/**
 * Get the content of a page given its path object and data object.
 */
export type GetContent<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
> = (
    params: GetContentParams<PATH, DATA>,
) => Promise<string> | string;

export type StaticPageDescriptor<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> = {
    self: URL;
    pattern: string;
    getPathList: GetPathList<PATH>;
    postDynamicData?: PostDynamicData<PATH, DATA, BODY>;
    getStaticData: GetStaticData<PATH, DATA>;
    getContent: GetContent<PATH, DATA>;
};

export type DynamicPageDescriptor<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> = {
    self: URL;
    pattern: string;
    getDynamicData: GetDynamicData<PATH, DATA, BODY>;
    postDynamicData?: PostDynamicData<PATH, DATA, BODY>;
    getContent: GetContent<PATH, DATA>;
};

export type PageDescriptor<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> =
    | StaticPageDescriptor<PATH, DATA, BODY>
    | DynamicPageDescriptor<PATH, DATA, BODY>;

/**
 * Build a page object from a page descriptor
 */
export function page<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    descriptor: StaticPageDescriptor<PATH, DATA, BODY>,
): Page<PATH, DATA, BODY>;
export function page<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    descriptor: DynamicPageDescriptor<PATH, DATA, BODY>,
): Page<PATH, DATA, BODY>;
export function page<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    // deno-lint-ignore no-explicit-any
    descriptor: any,
): Page<PATH, DATA, BODY> {
    if (isStaticDescriptor<PATH, DATA, BODY>(descriptor)) {
        return new StaticPage(descriptor);
    }
    if (isDynamicDescriptor<PATH, DATA, BODY>(descriptor)) {
        return new DynamicPage(descriptor);
    }

    assert(
        false,
        `Page descriptor ${
            String(descriptor.self ?? 'UNKNOWN')
        } has neither "getDynamicData" nor "getStaticData" method`,
    );
}

function isDynamicDescriptor<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    // deno-lint-ignore no-explicit-any
    descriptor: any,
): descriptor is DynamicPageDescriptor<PATH, DATA, BODY> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getDynamicData' in descriptor) {
            validateDynamicDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

function isStaticDescriptor<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    // deno-lint-ignore no-explicit-any
    descriptor: any,
): descriptor is StaticPageDescriptor<PATH, DATA, BODY> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getStaticData' in descriptor) {
            validateStaticDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

function validateStaticDescriptor<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    descriptor: StaticPageDescriptor<PATH, DATA, BODY>,
): void {
    assert(
        descriptor.self instanceof URL,
        `Page descriptor has no self`,
    );
    assert(
        typeof descriptor.pattern === 'string',
        `Page descriptor ${String(descriptor.self)} has no pattern`,
    );
    assert(
        typeof descriptor.getPathList === 'function',
        `Page descriptor "${descriptor.pattern}" has no getPathList function`,
    );
    assert(
        typeof descriptor.getStaticData === 'function',
        `Page descriptor "${descriptor.pattern}" has no getData function`,
    );
    assert(
        typeof descriptor.getContent === 'function',
        `Page descriptor "${descriptor.pattern}" has no getContent function`,
    );
}

function validateDynamicDescriptor<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    descriptor: DynamicPageDescriptor<PATH, DATA, BODY>,
): void {
    assert(
        descriptor.self instanceof URL,
        `Page descriptor has no self`,
    );
    assert(
        typeof descriptor.pattern === 'string',
        `Page descriptor ${String(descriptor.self)} has no pattern`,
    );
    assert(
        typeof descriptor.getDynamicData === 'function',
        `Page descriptor "${descriptor.pattern}" has no getData function`,
    );
    assert(
        typeof descriptor.getContent === 'function',
        `Page descriptor "${descriptor.pattern}" has no getContent function`,
    );
}

export type Page<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> =
    | StaticPage<PATH, DATA, BODY>
    | DynamicPage<PATH, DATA, BODY>;

export class BasePage<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
    DESCRIPTOR extends PageDescriptor<PATH, DATA, BODY> = PageDescriptor<
        PATH,
        DATA,
        BODY
    >,
> {
    protected descriptor: DESCRIPTOR;
    private urlCompiler: pathToRegexp.PathFunction<PATH>;
    private urlMatcher: pathToRegexp.MatchFunction<PATH>;

    constructor(
        descriptor: DESCRIPTOR,
    ) {
        this.descriptor = descriptor;
        this.urlCompiler = pathToRegexp.compile(this.descriptor.pattern);
        this.urlMatcher = pathToRegexp.match(this.descriptor.pattern);
    }

    get pattern() {
        return this.descriptor.pattern;
    }

    get self() {
        return this.descriptor.self;
    }

    getContent(params: Omit<GetContentParams<PATH, DATA>, 'entrypoint'>) {
        return this.descriptor.getContent({
            ...params,
            entrypoint: this.descriptor.self,
        });
    }

    compile(path: PATH) {
        return this.urlCompiler(path);
    }

    match(path: string) {
        return this.urlMatcher(path);
    }

    get canPostDynamicData() {
        return this.descriptor.postDynamicData !== undefined;
    }

    postDynamicData(params: PostDynamicDataParams<PATH, BODY>) {
        if (this.descriptor.postDynamicData === undefined) {
            throw new FrugalError(
                `Unable to handle post, descriptor ${this.descriptor.pattern} has no postDynamicData`,
            );
        }

        return this.descriptor.postDynamicData(params);
    }
}

export class StaticPage<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> extends BasePage<
    PATH,
    DATA,
    BODY,
    StaticPageDescriptor<PATH, DATA, BODY>
> implements StaticPageDescriptor<PATH, DATA, BODY> {
    constructor(
        descriptor: StaticPageDescriptor<PATH, DATA, BODY>,
    ) {
        super(descriptor);
    }

    getStaticData(params: GetStaticDataParams<PATH>) {
        return this.descriptor.getStaticData(params);
    }

    getPathList(params: GetPathListParams) {
        return this.descriptor.getPathList(params);
    }
}

export class DynamicPage<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> extends BasePage<
    PATH,
    DATA,
    BODY,
    DynamicPageDescriptor<PATH, DATA, BODY>
> implements DynamicPageDescriptor<PATH, DATA, BODY> {
    constructor(
        descriptor: DynamicPageDescriptor<PATH, DATA, BODY>,
    ) {
        super(descriptor);
    }

    getDynamicData(params: GetDynamicDataParams<PATH, BODY>) {
        return this.descriptor.getDynamicData(params);
    }
}
