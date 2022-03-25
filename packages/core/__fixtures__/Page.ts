import {
    DynamicPage,
    GetContent,
    GetDynamicData,
    GetRequestList,
    GetStaticData,
    StaticPage,
} from '../Page.ts';
import { spy } from '../../test_util/mod.ts';

type FakeDynamicPageConfig<REQUEST extends object, DATA> = {
    self?: URL;
    pattern?: string;
    getDynamicData?: GetDynamicData<REQUEST, DATA>;
    getContent?: GetContent<REQUEST, DATA>;
    mock?: {
        getDynamicData?: DynamicPage<REQUEST, DATA>['getDynamicData'];
        getContent?: DynamicPage<REQUEST, DATA>['getContent'];
    };
};

export function fakeDynamicPage<REQUEST extends object, DATA>(
    {
        self = new URL('file:///'),
        pattern = '',
        getDynamicData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeDynamicPageConfig<REQUEST, DATA> = {},
) {
    const page = new DynamicPage<REQUEST, DATA>({
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

type FakeStaticPageConfig<REQUEST extends object, DATA> = {
    self?: URL;
    pattern?: string;
    getRequestList?: GetRequestList<REQUEST>;
    getStaticData?: GetStaticData<REQUEST, DATA>;
    getContent?: GetContent<REQUEST, DATA>;
    mock?: {
        getRequestList?: StaticPage<REQUEST, DATA>['getRequestList'];
        getStaticData?: StaticPage<REQUEST, DATA>['getStaticData'];
        getContent?: StaticPage<REQUEST, DATA>['getContent'];
    };
};

export function fakeStaticPage<REQUEST extends object, DATA>(
    {
        self = new URL('file:///'),
        pattern = '',
        getRequestList = () => [],
        getStaticData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeStaticPageConfig<
        REQUEST,
        DATA
    > = {},
) {
    const page = new StaticPage<REQUEST, DATA>({
        self,
        pattern,
        getRequestList,
        getStaticData,
        getContent,
    });

    const originalGetContent = page.getContent;
    page.getContent = spy(mock.getContent ?? originalGetContent.bind(page));

    const originalGetDynamicData = page.getStaticData;
    page.getStaticData = spy(
        mock.getStaticData ?? originalGetDynamicData.bind(page),
    );

    const originalGetRequestList = page.getRequestList;
    page.getRequestList = spy(
        mock.getRequestList ?? originalGetRequestList.bind(page),
    );

    return page;
}
