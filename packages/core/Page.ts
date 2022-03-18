import { PageContext } from './loader.ts';
import { assert } from '../assert/mod.ts';
import { Cache } from './Cache.ts';
import * as pathToRegexp from '../../dep/path-to-regexp.ts';

export type Phase = 'build'|'regenerate'|'generate'

export type GetRequestListParams = {
    phase: Phase
};

export type GetStaticDataParams<REQUEST> = {
    phase: Phase;
    request: REQUEST;
    cache: Cache;
};

export type GetDynamicDataParams<REQUEST> = {
    phase: Phase;
    request: REQUEST;
    cache: Cache;
    searchParams: URLSearchParams
}

export type GetContentParams<REQUEST, DATA> = {
    phase: Phase
    request: REQUEST;
    data: DATA;
    pathname: string;
    entrypoint: string;
    context: PageContext;
    cache: Cache;
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
    pattern: string;
    getRequestList: GetRequestList<REQUEST>;
    getStaticData: GetStaticData<REQUEST, DATA>;
    getContent: GetContent<REQUEST, DATA>;
}

export type DynamicPageDescriptor<REQUEST, DATA> = {
    pattern: string;
    getDynamicData: GetDynamicData<REQUEST, DATA>;
    getContent: GetContent<REQUEST, DATA>;
};

export async function load<REQUEST extends object, DATA>(
    path: string,
    hash: string,
): Promise<Page<REQUEST, DATA>> {
    const descriptor = await import(path);
    if (isStaticDescriptor<REQUEST, DATA>(path, descriptor)) {
        return new StaticPage(path, hash, descriptor);
    }
    if (isDynamicDescriptor<REQUEST, DATA>(path, descriptor)) {
        return new DynamicPage(path, hash, descriptor)
    }
    assert(false, `Page descriptor "${path}" has neither "getDynamicData" nor "getStaticData" method`)
}

function isStaticDescriptor<REQUEST extends object, DATA>(
    path: string,
    descriptor: any,
): descriptor is StaticPageDescriptor<REQUEST, DATA> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getDynamicData' in descriptor) {
            validateDynamicDescriptor(path, descriptor)
            return true;
        } 
    }
    return false
}

function isDynamicDescriptor<REQUEST extends object, DATA>(
    path: string,
    descriptor: any,
): descriptor is DynamicPageDescriptor<REQUEST, DATA> {
    if (typeof descriptor === 'object' && descriptor !== null) {
        if ('getStaticData' in descriptor) {
            validateStaticDescriptor(path, descriptor)
            return true
        }
    }
    return false
}


function validateStaticDescriptor<REQUEST extends object, DATA>(
    path: string,
    descriptor: StaticPageDescriptor<REQUEST, DATA>,
): void {
    assert(
        typeof descriptor.pattern === 'string',
        `Page descriptor "${path}" has no pattern`,
    );
    assert(
        typeof descriptor.getRequestList === 'function',
        `Page descriptor "${path}" has no getRequestList function`,
    );
    assert(
        typeof descriptor.getStaticData === 'function',
        `Page descriptor "${path}" has no getData function`,
    );
    assert(
        typeof descriptor.getContent === 'function',
        `Page descriptor "${path}" has no getContent function`,
    );
}

function validateDynamicDescriptor<REQUEST extends object, DATA>(
    path: string,
    descriptor: DynamicPageDescriptor<REQUEST, DATA>,
): void {
    assert(
        typeof descriptor.pattern === 'string',
        `Page descriptor "${path}" has no pattern`,
    );
    assert(
        typeof descriptor.getDynamicData === 'function',
        `Page descriptor "${path}" has no getData function`,
    );
    assert(
        typeof descriptor.getContent === 'function',
        `Page descriptor "${path}" has no getContent function`,
    );
}

export type Page<REQUEST extends object, DATA> = StaticPage<REQUEST, DATA> | DynamicPage<REQUEST, DATA>

export class BasePage<REQUEST extends object, DATA, DESCRIPTOR extends StaticPageDescriptor<REQUEST, DATA>|DynamicPageDescriptor<REQUEST, DATA>> {
    protected descriptor: DESCRIPTOR;
    readonly path: string;
    readonly hash: string;
    private urlCompiler: pathToRegexp.PathFunction<REQUEST>;
    private urlMatcher: pathToRegexp.MatchFunction<REQUEST>;

    constructor(
        path: string,
        hash: string,
        descriptor: DESCRIPTOR,
    ) {
        this.descriptor = descriptor;
        this.hash = hash;
        this.path = path;
        this.urlCompiler = pathToRegexp.compile(this.descriptor.pattern)
        this.urlMatcher = pathToRegexp.match(this.descriptor.pattern)
    }

    get pattern() {
        return this.descriptor.pattern;
    }

    getContent(params: Omit<GetContentParams<REQUEST, DATA>, 'entrypoint'>) {
        return this.descriptor.getContent({ ...params, entrypoint: this.path });
    }

    compile(request: REQUEST) {
        return this.urlCompiler(request)
    }

    match(path: string) {
        return this.urlMatcher(path)
    }
}

export class StaticPage<REQUEST extends object, DATA> extends BasePage<REQUEST, DATA, StaticPageDescriptor<REQUEST, DATA>> implements StaticPageDescriptor<REQUEST, DATA> {
    constructor(
        path: string,
        hash: string,
        descriptor: StaticPageDescriptor<REQUEST, DATA>,
    ) {
        super(path, hash, descriptor)
    }

    getStaticData(params: GetStaticDataParams<REQUEST>) {
        return this.descriptor.getStaticData(params);
    }

    getRequestList(params: GetRequestListParams) {
        return this.descriptor.getRequestList(params);
    }
}

export class DynamicPage<REQUEST extends object, DATA> extends BasePage<REQUEST, DATA, DynamicPageDescriptor<REQUEST, DATA>> implements DynamicPageDescriptor<REQUEST, DATA> {
    constructor(
        path: string,
        hash: string,
        descriptor: DynamicPageDescriptor<REQUEST, DATA>,
    ) {
        super(path, hash, descriptor)
    }

    getDynamicData(params: GetDynamicDataParams<REQUEST>) {
        return this.descriptor.getDynamicData(params);
    }
}