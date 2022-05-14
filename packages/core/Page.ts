import { LoaderContext } from './LoaderContext.ts';
import { assert } from '../../dep/std/asserts.ts';
import * as pathToRegexp from '../../dep/path-to-regexp.ts';

export type Phase = 'build' | 'refresh' | 'generate';

export type GetPathListParams = {
    phase: Phase;
};

export type GetStaticDataParams<PATH> = {
    phase: Phase;
    path: PATH;
};

export type GetDynamicDataParams<PATH> = {
    phase: Phase;
    path: PATH;
    request: Request;
};

export type PostDynamicDataParams<PATH> = {
    phase: 'generate';
    path: PATH;
    request: Request;
};

export type GetContentParams<PATH, DATA> = {
    method: 'POST' | 'GET';
    phase: Phase;
    path: PATH;
    data: DATA;
    pathname: string;
    entrypoint: URL;
    loaderContext: LoaderContext;
};

export type GetPathList<PATH> = (
    params: GetPathListParams,
) => Promise<PATH[]> | PATH[];

export type GetStaticData<PATH, DATA> = (
    params: GetStaticDataParams<PATH>,
) => Promise<DATA> | DATA;

export type GetDynamicData<PATH, DATA> = (
    params: GetDynamicDataParams<PATH>,
) => Promise<DATA> | DATA;

export type PostDynamicData<PATH, DATA> = (
    params: PostDynamicDataParams<PATH>,
) => Promise<DATA> | DATA;

export type GetContent<PATH, DATA> = (
    params: GetContentParams<PATH, DATA>,
) => Promise<string> | string;

export type StaticPageDescriptor<PATH, DATA> = {
    self: URL;
    pattern: string;
    getPathList: GetPathList<PATH>;
    postDynamicData?: PostDynamicData<PATH, DATA>;
    getStaticData: GetStaticData<PATH, DATA>;
    getContent: GetContent<PATH, DATA>;
};

export type DynamicPageDescriptor<PATH, DATA> = {
    self: URL;
    pattern: string;
    getDynamicData: GetDynamicData<PATH, DATA>;
    postDynamicData?: PostDynamicData<PATH, DATA>;
    getContent: GetContent<PATH, DATA>;
};

// deno-lint-ignore ban-types
export function page<PATH extends object, DATA>(
    descriptor: StaticPageDescriptor<PATH, DATA>,
): Page<PATH, DATA>;
// deno-lint-ignore ban-types
export function page<PATH extends object, DATA>(
    descriptor: DynamicPageDescriptor<PATH, DATA>,
): Page<PATH, DATA>;
// deno-lint-ignore ban-types
export function page<PATH extends object, DATA>(
    // deno-lint-ignore no-explicit-any
    descriptor: any,
): Page<PATH, DATA> {
    if (isStaticDescriptor<PATH, DATA>(descriptor)) {
        return new StaticPage(descriptor);
    }
    if (isDynamicDescriptor<PATH, DATA>(descriptor)) {
        return new DynamicPage(descriptor);
    }

    assert(
        false,
        `Page descriptor ${
            String(descriptor.self ?? 'UNKNOWN')
        } has neither "getDynamicData" nor "getStaticData" method`,
    );
}

// deno-lint-ignore ban-types
function isDynamicDescriptor<PATH extends object, DATA>(
    // deno-lint-ignore no-explicit-any
    descriptor: any,
): descriptor is DynamicPageDescriptor<PATH, DATA> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getDynamicData' in descriptor) {
            validateDynamicDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

// deno-lint-ignore ban-types
function isStaticDescriptor<PATH extends object, DATA>(
    // deno-lint-ignore no-explicit-any
    descriptor: any,
): descriptor is StaticPageDescriptor<PATH, DATA> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getStaticData' in descriptor) {
            validateStaticDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

// deno-lint-ignore ban-types
function validateStaticDescriptor<PATH extends object, DATA>(
    descriptor: StaticPageDescriptor<PATH, DATA>,
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

// deno-lint-ignore ban-types
function validateDynamicDescriptor<PATH extends object, DATA>(
    descriptor: DynamicPageDescriptor<PATH, DATA>,
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

// deno-lint-ignore ban-types
export type Page<PATH extends object, DATA> =
    | StaticPage<PATH, DATA>
    | DynamicPage<PATH, DATA>;

export class BasePage<
    // deno-lint-ignore ban-types
    PATH extends object,
    DATA,
    DESCRIPTOR extends
        | StaticPageDescriptor<PATH, DATA>
        | DynamicPageDescriptor<PATH, DATA>,
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

    postDynamicData(params: PostDynamicDataParams<PATH>) {
        if (this.descriptor.postDynamicData === undefined) {
            throw Error(
                `Unable to handle post, descriptor ${this.descriptor.pattern} has no postDynamicData`,
            );
        }

        return this.descriptor.postDynamicData(params);
    }
}

// deno-lint-ignore ban-types
export class StaticPage<PATH extends object, DATA> extends BasePage<
    PATH,
    DATA,
    StaticPageDescriptor<PATH, DATA>
> implements StaticPageDescriptor<PATH, DATA> {
    constructor(
        descriptor: StaticPageDescriptor<PATH, DATA>,
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

// deno-lint-ignore ban-types
export class DynamicPage<PATH extends object, DATA> extends BasePage<
    PATH,
    DATA,
    DynamicPageDescriptor<PATH, DATA>
> implements DynamicPageDescriptor<PATH, DATA> {
    constructor(
        descriptor: DynamicPageDescriptor<PATH, DATA>,
    ) {
        super(descriptor);
    }

    getDynamicData(params: GetDynamicDataParams<PATH>) {
        return this.descriptor.getDynamicData(params);
    }
}
