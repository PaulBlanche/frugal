import { PageContext } from './loader.ts';
import { assert } from '../assert/mod.ts';
import { Cache } from './Cache.ts';

export type Phase = 'build'|'regenerate'

export type GetRequestListParams = {
    phase: Phase
};

export type GetDataParams<REQUEST> = {
    phase: Phase
    request: REQUEST;
    cache: Cache;
};

export type GetContentParams<REQUEST, DATA> = {
    phase: Phase
    request: REQUEST;
    data: DATA;
    url: string;
    path: string;
    context: PageContext;
    cache: Cache;
};

export type GetRequestList<REQUEST> = (
    params: GetRequestListParams,
) => Promise<REQUEST[]>;

export type GetData<REQUEST, DATA> = (
    params: GetDataParams<REQUEST>,
) => Promise<DATA> | DATA;

export type GetContent<REQUEST, DATA> = (
    params: GetContentParams<REQUEST, DATA>,
) => Promise<string> | string;

export type PageDescriptor<REQUEST, DATA> = {
    getRequestList: GetRequestList<REQUEST>;
    getData: GetData<REQUEST, DATA>;
    pattern: string;
    getContent: GetContent<REQUEST, DATA>;
};

export class Page<REQUEST extends object, DATA>
    implements PageDescriptor<REQUEST, DATA> {
    private descriptor: PageDescriptor<REQUEST, DATA>;
    readonly path: string;
    readonly hash: string;

    static async load<REQUEST extends object, DATA>(
        path: string,
        hash: string,
    ): Promise<Page<REQUEST, DATA>> {
        const descriptor = await import(path);
        this.validateDescriptor(path, descriptor);
        return new Page(path, hash, descriptor);
    }

    static validateDescriptor<REQUEST extends object, DATA>(
        path: string,
        descriptor: PageDescriptor<REQUEST, DATA>,
    ): void {
        assert(
            typeof descriptor.getRequestList === 'function',
            `Page descriptor "${path}" has no getRequestList function`,
        );
        assert(
            typeof descriptor.getData === 'function',
            `Page descriptor "${path}" has no getData function`,
        );
        assert(
            typeof descriptor.pattern === 'string',
            `Page descriptor "${path}" has no pattern`,
        );
        assert(
            typeof descriptor.getContent === 'function',
            `Page descriptor "${path}" has no getContent function`,
        );
    }

    private constructor(
        path: string,
        hash: string,
        descriptor: PageDescriptor<REQUEST, DATA>,
    ) {
        this.descriptor = descriptor;
        this.hash = hash;
        this.path = path;
    }

    getData(params: GetDataParams<REQUEST>) {
        return this.descriptor.getData(params);
    }

    getRequestList(params: GetRequestListParams) {
        return this.descriptor.getRequestList(params);
    }

    get pattern() {
        return this.descriptor.pattern;
    }

    getContent(params: Omit<GetContentParams<REQUEST, DATA>, 'path'>) {
        return this.descriptor.getContent({ ...params, path: this.path });
    }
}
