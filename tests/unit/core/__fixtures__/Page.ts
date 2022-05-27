import {
    DynamicPage,
    GetContent,
    GetDynamicData,
    GetPathList,
    GetStaticData,
    PostDynamicData,
    StaticPage,
} from '../../../../packages/core/Page.ts';
import { spy } from '../../../../dep/std/mock.ts';

type FakeDynamicPageConfig<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> = {
    self?: URL;
    pattern?: string;
    getDynamicData?: GetDynamicData<PATH, DATA, BODY>;
    postDynamicData?: PostDynamicData<PATH, DATA, BODY>;
    getContent?: GetContent<PATH, DATA>;
    mock?: {
        getDynamicData?: DynamicPage<PATH, DATA, BODY>['getDynamicData'];
        postDynamicData?: DynamicPage<PATH, DATA, BODY>['postDynamicData'];
        getContent?: DynamicPage<PATH, DATA, BODY>['getContent'];
    };
};

export function fakeDynamicPage<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    {
        self = new URL('file:///'),
        pattern = '',
        postDynamicData,
        getDynamicData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeDynamicPageConfig<PATH, DATA, BODY> = {},
) {
    const page = new DynamicPage<PATH, DATA, BODY>({
        self,
        pattern,
        postDynamicData,
        getDynamicData,
        getContent,
    });

    const originalGetContent = page.getContent;
    page.getContent = spy(mock.getContent ?? originalGetContent.bind(page));

    const originalGetDynamicData = page.getDynamicData;
    page.getDynamicData = spy(
        mock.getDynamicData ?? originalGetDynamicData.bind(page),
    );

    const originalPostDynamicData = page.postDynamicData;
    page.postDynamicData = spy(
        mock.getDynamicData ?? originalPostDynamicData.bind(page),
    );

    return page;
}

type FakeStaticPageConfig<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
> = {
    self?: URL;
    pattern?: string;
    getPathList?: GetPathList<PATH>;
    postDynamicData?: PostDynamicData<PATH, DATA, BODY>;
    getStaticData?: GetStaticData<PATH, DATA>;
    getContent?: GetContent<PATH, DATA>;
    mock?: {
        getPathList?: StaticPage<PATH, DATA, BODY>['getPathList'];
        postDynamicData?: StaticPage<PATH, DATA, BODY>['postDynamicData'];
        getStaticData?: StaticPage<PATH, DATA, BODY>['getStaticData'];
        getContent?: StaticPage<PATH, DATA, BODY>['getContent'];
    };
};

export function fakeStaticPage<
    PATH extends Record<string, string> = Record<string, string>,
    DATA = unknown,
    BODY = unknown,
>(
    {
        self = new URL('file:///'),
        pattern = '',
        getPathList = () => [],
        postDynamicData,
        getStaticData = () => ({} as any),
        getContent = () => '',
        mock = {},
    }: FakeStaticPageConfig<PATH, DATA, BODY> = {},
) {
    const page = new StaticPage<PATH, DATA, BODY>({
        self,
        pattern,
        postDynamicData,
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

    const originalPostDynamicData = page.postDynamicData;
    page.postDynamicData = spy(
        mock.postDynamicData ?? originalPostDynamicData.bind(page),
    );

    return page;
}
