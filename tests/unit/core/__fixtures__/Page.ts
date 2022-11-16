import {
    DynamicPage,
    GetContent,
    GetDynamicData,
    GetPathList,
    GetStaticData,
    Handlers,
    StaticPage,
} from '../../../../packages/core/Page.ts';
import { spy } from '../../../../dep/std/testing/mock.ts';

type FakeDynamicPageConfig<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
> = {
    self?: URL;
    pattern?: string;
    getDynamicData?: GetDynamicData<PATH, DATA>;
    handlers?: Handlers<PATH, DATA>;
    getContent?: GetContent<PATH, DATA>;
    mock?: {
        getDynamicData?: DynamicPage<PATH, DATA>['getDynamicData'];
        handlers?: DynamicPage<PATH, DATA>['handlers'];
        getContent?: DynamicPage<PATH, DATA>['getContent'];
    };
};

export function fakeDynamicPage<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
>(
    {
        self = new URL('file:///'),
        pattern = '',
        handlers,
        getDynamicData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeDynamicPageConfig<PATH, DATA> = {},
) {
    const page = new DynamicPage<PATH, DATA>({
        self,
        pattern,
        handlers,
        getDynamicData,
        getContent,
    });

    const originalGetContent = page.getContent;
    page.getContent = spy(mock.getContent ?? originalGetContent.bind(page));

    const originalGetDynamicData = page.getDynamicData;
    page.getDynamicData = spy(
        mock.getDynamicData ?? originalGetDynamicData.bind(page),
    );

    for (const method of Object.keys(page.handlers)) {
        const originalHandler = page.handlers[method];
        if (originalHandler) {
            page.handlers[method] = spy(
                mock.handlers?.[method] ?? originalHandler,
            );
        }
    }

    return page;
}

type FakeStaticPageConfig<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
> = {
    self?: URL;
    pattern?: string;
    getPathList?: GetPathList<PATH>;
    handlers?: Handlers<PATH, DATA>;
    getStaticData?: GetStaticData<PATH, DATA>;
    getContent?: GetContent<PATH, DATA>;
    mock?: {
        getPathList?: StaticPage<PATH, DATA>['getPathList'];
        handlers?: DynamicPage<PATH, DATA>['handlers'];
        getStaticData?: StaticPage<PATH, DATA>['getStaticData'];
        getContent?: StaticPage<PATH, DATA>['getContent'];
    };
};

export function fakeStaticPage<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
>(
    {
        self = new URL('file:///'),
        pattern = '',
        getPathList = () => [],
        handlers,
        getStaticData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeStaticPageConfig<PATH, DATA> = {},
) {
    const page = new StaticPage<PATH, DATA>({
        self,
        pattern,
        handlers,
        getPathList,
        getStaticData,
        getContent,
    });

    const originalGetContent = page.getContent;
    page.getContent = spy(mock.getContent ?? originalGetContent.bind(page));

    const originalGetDynamicData = page.getStaticData;
    page.getStaticData = spy(
        mock.getStaticData ?? originalGetDynamicData.bind(page),
    );

    const originalGetPathList = page.getPathList;
    page.getPathList = spy(
        mock.getPathList ?? originalGetPathList.bind(page),
    );

    for (const method of Object.keys(page.handlers)) {
        const originalHandler = page.handlers[method];
        if (originalHandler) {
            page.handlers[method] = spy(
                mock.handlers?.[method] ?? originalHandler,
            );
        }
    }

    return page;
}
