import {
    DynamicHandler,
    GetContent,
    GetPathList,
    RawHandler,
    StaticHandler,
} from '../../../../packages/core/PageDescriptor.ts';
import { DynamicPage, StaticPage } from '../../../../packages/core/Page.ts';
import { spy, stub } from '../../../../dep/std/testing/mock.ts';

type FakeDynamicPageConfig<DATA = unknown, PATH extends string = string> = {
    self?: URL;
    pattern?: string;
    GET?: DynamicHandler<DATA, PATH>;
    POST?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    PUT?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    PATCH?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    DELETE?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    OPTIONS?: RawHandler<PATH>;
    getContent?: GetContent<DATA, PATH>;
    mock?: {
        GET?: DynamicPage<DATA, PATH>['GET'];
        POST?: DynamicPage<DATA, PATH>['POST'];
        PUT?: DynamicPage<DATA, PATH>['PUT'];
        PATCH?: DynamicPage<DATA, PATH>['PATCH'];
        DELETE?: DynamicPage<DATA, PATH>['DELETE'];
        OPTIONS?: DynamicPage<DATA, PATH>['OPTIONS'];
        getContent?: DynamicPage<DATA, PATH>['getContent'];
    };
};

export function fakeDynamicPage<DATA = unknown, PATH extends string = string>(
    {
        self = new URL('file:///'),
        pattern = '',
        GET = () => ({} as any),
        POST,
        PUT,
        PATCH,
        DELETE,
        OPTIONS,
        getContent = () => '',
        mock = {},
    }: FakeDynamicPageConfig<DATA, PATH> = {},
) {
    const page = new DynamicPage<DATA, PATH>({
        type: 'dynamic',
        self,
        pattern,
        GET,
        POST,
        PUT,
        PATCH,
        DELETE,
        OPTIONS,
        getContent,
    });

    for (
        const prop of [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
            'getContent',
        ]
    ) {
        const property = prop as keyof typeof mock;
        stub(
            page,
            property,
            (mock[property] as any) ?? page[property]?.bind(page),
        );
    }

    return page;
}

type FakeStaticPageConfig<DATA = unknown, PATH extends string = string> = {
    self?: URL;
    pattern?: string;
    getPathList?: GetPathList<PATH>;
    GET?: StaticHandler<DATA, PATH>;
    POST?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    PUT?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    PATCH?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    DELETE?: DynamicHandler<DATA, PATH> | RawHandler<PATH>;
    OPTIONS?: RawHandler<PATH>;
    getContent?: GetContent<DATA, PATH>;
    mock?: {
        getPathList?: StaticPage<DATA, PATH>['getPathList'];
        GET?: StaticPage<DATA, PATH>['GET'];
        POST?: StaticPage<DATA, PATH>['POST'];
        PUT?: StaticPage<DATA, PATH>['PUT'];
        PATCH?: StaticPage<DATA, PATH>['PATCH'];
        DELETE?: StaticPage<DATA, PATH>['DELETE'];
        OPTIONS?: StaticPage<DATA, PATH>['OPTIONS'];
        getContent?: StaticPage<DATA, PATH>['getContent'];
    };
};

export function fakeStaticPage<DATA = unknown, PATH extends string = string>(
    {
        self = new URL('file:///'),
        pattern = '',
        getPathList = () => [],
        GET = () => ({} as any),
        POST,
        PUT,
        PATCH,
        DELETE,
        OPTIONS,
        getContent = () => '',
        mock = {},
    }: FakeStaticPageConfig<DATA, PATH> = {},
) {
    const page = new StaticPage<DATA, PATH>({
        type: 'static',
        self,
        pattern,
        GET,
        POST,
        PUT,
        PATCH,
        DELETE,
        OPTIONS,
        getContent,
        getPathList,
    });

    for (
        const prop of [
            'getPathList',
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS',
            'getContent',
        ]
    ) {
        const property = prop as keyof typeof mock;
        stub(
            page,
            property,
            (mock[property] as any) ?? page[property]?.bind(page),
        );
    }

    return page;
}
