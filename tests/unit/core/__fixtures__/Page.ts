import {
    DynamicPage,
    GetContent,
    GetDynamicData,
    GetPathList,
    GetStaticData,
    StaticPage,
} from '../../../../packages/core/Page.ts';
import { spy } from '../../../../dep/std/mock.ts';

type FakeDynamicPageConfig<PATH extends object, DATA> = {
    self?: URL;
    pattern?: string;
    getDynamicData?: GetDynamicData<PATH, DATA>;
    getContent?: GetContent<PATH, DATA>;
    mock?: {
        getDynamicData?: DynamicPage<PATH, DATA>['getDynamicData'];
        getContent?: DynamicPage<PATH, DATA>['getContent'];
    };
};

export function fakeDynamicPage<PATH extends object, DATA>(
    {
        self = new URL('file:///'),
        pattern = '',
        getDynamicData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeDynamicPageConfig<PATH, DATA> = {},
) {
    const page = new DynamicPage<PATH, DATA>({
        self,
        pattern,
        getDynamicData,
        getContent,
    });

    const originalGetContent = page.getContent;
    page.getContent = spy(mock.getContent ?? originalGetContent.bind(page));

    const originalGetDynamicData = page.getDynamicData;
    page.getDynamicData = spy(
        mock.getDynamicData ?? originalGetDynamicData.bind(page),
    );

    return page;
}

type FakeStaticPageConfig<PATH extends object, DATA> = {
    self?: URL;
    pattern?: string;
    getPathList?: GetPathList<PATH>;
    getStaticData?: GetStaticData<PATH, DATA>;
    getContent?: GetContent<PATH, DATA>;
    mock?: {
        getRequestList?: StaticPage<PATH, DATA>['getPathList'];
        getStaticData?: StaticPage<PATH, DATA>['getStaticData'];
        getContent?: StaticPage<PATH, DATA>['getContent'];
    };
};

export function fakeStaticPage<PATH extends object, DATA>(
    {
        self = new URL('file:///'),
        pattern = '',
        getPathList = () => [],
        getStaticData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeStaticPageConfig<PATH, DATA> = {},
) {
    const page = new StaticPage<PATH, DATA>({
        self,
        pattern,
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

    const originalGetRequestList = page.getPathList;
    page.getPathList = spy(
        mock.getRequestList ?? originalGetRequestList.bind(page),
    );

    return page;
}
