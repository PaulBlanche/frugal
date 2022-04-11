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

export type PostDynamicDataParams<REQUEST, POST_BODY> = {
    phase: 'generate';
    request: REQUEST;
    searchParams: URLSearchParams;
    body: POST_BODY;
};

export type GetContentParams<REQUEST, DATA> = {
    method: 'POST' | 'GET';
    phase: Phase;
    request: REQUEST;
    data: DATA;
    pathname: string;
    entrypoint: URL;
    loaderContext: LoaderContext;
};

export type GetRequestList<REQUEST> = (
    params: GetRequestListParams,
) => Promise<REQUEST[]> | REQUEST[];

export type GetStaticData<REQUEST, DATA> = (
    params: GetStaticDataParams<REQUEST>,
) => Promise<DATA> | DATA;

export type GetDynamicData<REQUEST, DATA> = (
    params: GetDynamicDataParams<REQUEST>,
) => Promise<DATA> | DATA;

export type PostDynamicData<REQUEST, DATA, POST_BODY> = (
    params: PostDynamicDataParams<REQUEST, POST_BODY>,
) => Promise<DATA> | DATA;

export type GetContent<REQUEST, DATA> = (
    params: GetContentParams<REQUEST, DATA>,
) => Promise<string> | string;

export type StaticPageDescriptor<REQUEST, DATA, POST_BODY> = {
    self: URL;
    pattern: string;
    getRequestList: GetRequestList<REQUEST>;
    postDynamicData?: PostDynamicData<REQUEST, DATA, POST_BODY>;
    getStaticData: GetStaticData<REQUEST, DATA>;
    getContent: GetContent<REQUEST, DATA>;
};

export type DynamicPageDescriptor<REQUEST, DATA, POST_BODY> = {
    self: URL;
    pattern: string;
    getDynamicData: GetDynamicData<REQUEST, DATA>;
    postDynamicData?: PostDynamicData<REQUEST, DATA, POST_BODY>;
    getContent: GetContent<REQUEST, DATA>;
};

export function page<REQUEST extends object, DATA, POST_BODY>(
    descriptor: any,
): Page<REQUEST, DATA, POST_BODY> {
    if (isStaticDescriptor<REQUEST, DATA, POST_BODY>(descriptor)) {
        return new StaticPage(descriptor);
    }
    if (isDynamicDescriptor<REQUEST, DATA, POST_BODY>(descriptor)) {
        return new DynamicPage(descriptor);
    }

    assert(
        false,
        `Page descriptor ${
            String(descriptor.self ?? 'UNKNOWN')
        } has neither "getDynamicData" nor "getStaticData" method`,
    );
}

function isDynamicDescriptor<REQUEST extends object, DATA, POST_BODY>(
    descriptor: any,
): descriptor is DynamicPageDescriptor<REQUEST, DATA, POST_BODY> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getDynamicData' in descriptor) {
            validateDynamicDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

function isStaticDescriptor<REQUEST extends object, DATA, POST_BODY>(
    descriptor: any,
): descriptor is StaticPageDescriptor<REQUEST, DATA, POST_BODY> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getStaticData' in descriptor) {
            validateStaticDescriptor(descriptor);
            return true;
        }
    }
    return false;
}

function validateStaticDescriptor<REQUEST extends object, DATA, POST_BODY>(
    descriptor: StaticPageDescriptor<REQUEST, DATA, POST_BODY>,
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

function validateDynamicDescriptor<REQUEST extends object, DATA, POST_BODY>(
    descriptor: DynamicPageDescriptor<REQUEST, DATA, POST_BODY>,
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

export type Page<REQUEST extends object, DATA, POST_BODY> =
    | StaticPage<REQUEST, DATA, POST_BODY>
    | DynamicPage<REQUEST, DATA, POST_BODY>;

export class BasePage<
    REQUEST extends object,
    DATA,
    POST_BODY,
    DESCRIPTOR extends
        | StaticPageDescriptor<REQUEST, DATA, POST_BODY>
        | DynamicPageDescriptor<REQUEST, DATA, POST_BODY>,
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

    get canPostDynamicData() {
        return this.descriptor.postDynamicData !== undefined;
    }

    postDynamicData(params: PostDynamicDataParams<REQUEST, POST_BODY>) {
        if (this.descriptor.postDynamicData === undefined) {
            throw Error(
                `Unable to handle post, descriptor ${this.descriptor.pattern} has no postDynamicData`,
            );
        }

        return this.descriptor.postDynamicData(params);
    }
}

export class StaticPage<REQUEST extends object, DATA, POST_BODY>
    extends BasePage<
        REQUEST,
        DATA,
        POST_BODY,
        StaticPageDescriptor<REQUEST, DATA, POST_BODY>
    >
    implements StaticPageDescriptor<REQUEST, DATA, POST_BODY> {
    constructor(
        descriptor: StaticPageDescriptor<REQUEST, DATA, POST_BODY>,
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

export class DynamicPage<REQUEST extends object, DATA, POST_BODY>
    extends BasePage<
        REQUEST,
        DATA,
        POST_BODY,
        DynamicPageDescriptor<REQUEST, DATA, POST_BODY>
    >
    implements DynamicPageDescriptor<REQUEST, DATA, POST_BODY> {
    constructor(
        descriptor: DynamicPageDescriptor<REQUEST, DATA, POST_BODY>,
    ) {
        super(descriptor);
    }

    getDynamicData(params: GetDynamicDataParams<REQUEST>) {
        return this.descriptor.getDynamicData(params);
    }
}
