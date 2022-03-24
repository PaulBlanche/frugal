import { LoaderContext } from './LoaderContext.ts';
import { assert } from '../../dep/std/asserts.ts';
import * as pathToRegexp from '../../dep/path-to-regexp.ts';

export type Phase = 'build' | 'refresh' | 'generate';

export type GetRequestListParams = {
    phase: Phase;
};

export type GetStaticDataParams<REQUEST> = {
    phase: Phase;
    request: REQUEST;
};

export type GetDynamicDataParams<REQUEST> = {
    phase: Phase;
    request: REQUEST;
    searchParams: URLSearchParams;
};

export type GetContentParams<REQUEST, DATA> = {
    phase: Phase;
    request: REQUEST;
    data: DATA;
    pathname: string;
    entrypoint: URL;
    loaderContext: LoaderContext;
};

export type GetRequestList<REQUEST> = (
    params: GetRequestListParams,
) => Promise<REQUEST[]>;

export type GetStaticData<REQUEST, DATA> = (
    params: GetStaticDataParams<REQUEST>,
) => Promise<DATA> | DATA;

export type GetDynamicData<REQUEST, DATA> = (
    params: GetDynamicDataParams<REQUEST>,
) => Promise<DATA> | DATA;

export type GetContent<REQUEST, DATA> = (
    params: GetContentParams<REQUEST, DATA>,
) => Promise<string> | string;

export type StaticPageDescriptor<REQUEST, DATA> = {
    self: URL;
    pattern: string;
    getRequestList: GetRequestList<REQUEST>;
    getStaticData: GetStaticData<REQUEST, DATA>;
    getContent: GetContent<REQUEST, DATA>;
};

export type DynamicPageDescriptor<REQUEST, DATA> = {
    self: URL;
    pattern: string;
    getDynamicData: GetDynamicData<REQUEST, DATA>;
    getContent: GetContent<REQUEST, DATA>;
};

export function page<REQUEST extends object, DATA>(
    descriptor: any,
): Page<REQUEST, DATA> {
    if (isStaticDescriptor<REQUEST, DATA>(descriptor)) {
        return new StaticPage(descriptor);
    }
    if (isDynamicDescriptor<REQUEST, DATA>(descriptor)) {
        return new DynamicPage(descriptor);
    }

    assert(
        false,
        `Page descriptor ${
            String(descriptor.self ?? 'UNKNOWN')
        } has neither "getDynamicData" nor "getStaticData" method`,
    );
}

function isDynamicDescriptor<REQUEST extends object, DATA>(
    descriptor: any,
): descriptor is DynamicPageDescriptor<REQUEST, DATA> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getDynamicData' in descriptor) {
            validateDynamicDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

function isStaticDescriptor<REQUEST extends object, DATA>(
    descriptor: any,
): descriptor is StaticPageDescriptor<REQUEST, DATA> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getStaticData' in descriptor) {
            validateStaticDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

function validateStaticDescriptor<REQUEST extends object, DATA>(
    descriptor: StaticPageDescriptor<REQUEST, DATA>,
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
        typeof descriptor.getRequestList === 'function',
        `Page descriptor "${descriptor.pattern}" has no getRequestList function`,
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

function validateDynamicDescriptor<REQUEST extends object, DATA>(
    descriptor: DynamicPageDescriptor<REQUEST, DATA>,
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

export type Page<REQUEST extends object, DATA> =
    | StaticPage<REQUEST, DATA>
    | DynamicPage<REQUEST, DATA>;

export class BasePage<
    REQUEST extends object,
    DATA,
    DESCRIPTOR extends
        | StaticPageDescriptor<REQUEST, DATA>
        | DynamicPageDescriptor<REQUEST, DATA>,
> {
    protected descriptor: DESCRIPTOR;
    private urlCompiler: pathToRegexp.PathFunction<REQUEST>;
    private urlMatcher: pathToRegexp.MatchFunction<REQUEST>;

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

    getContent(params: Omit<GetContentParams<REQUEST, DATA>, 'entrypoint'>) {
        return this.descriptor.getContent({
            ...params,
            entrypoint: this.descriptor.self,
        });
    }

    compile(request: REQUEST) {
        return this.urlCompiler(request);
    }

    match(path: string) {
        return this.urlMatcher(path);
    }
}

export class StaticPage<REQUEST extends object, DATA>
    extends BasePage<REQUEST, DATA, StaticPageDescriptor<REQUEST, DATA>>
    implements StaticPageDescriptor<REQUEST, DATA> {
    constructor(
        descriptor: StaticPageDescriptor<REQUEST, DATA>,
    ) {
        super(descriptor);
    }

    getStaticData(params: GetStaticDataParams<REQUEST>) {
        return this.descriptor.getStaticData(params);
    }

    getRequestList(params: GetRequestListParams) {
        return this.descriptor.getRequestList(params);
    }
}

export class DynamicPage<REQUEST extends object, DATA>
    extends BasePage<REQUEST, DATA, DynamicPageDescriptor<REQUEST, DATA>>
    implements DynamicPageDescriptor<REQUEST, DATA> {
    constructor(
        descriptor: DynamicPageDescriptor<REQUEST, DATA>,
    ) {
        super(descriptor);
    }

    getDynamicData(params: GetDynamicDataParams<REQUEST>) {
        return this.descriptor.getDynamicData(params);
    }
}
