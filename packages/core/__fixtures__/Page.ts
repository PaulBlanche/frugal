import {
    DynamicPage,
    GetContent,
    GetDynamicData,
    GetRequestList,
    GetStaticData,
    StaticPage,
} from '../Page.ts';
import { spy } from '../../test_util/mod.ts';

export function fakeDynamicPage<REQUEST extends object, DATA>(
    { pattern, data, content }: {
        pattern: string;
        data: DATA | GetDynamicData<REQUEST, DATA>;
        content: string | GetContent<REQUEST, DATA>;
    },
) {
    const page = new DynamicPage<REQUEST, DATA>({
        self: new URL('file:///'),
        pattern,
        getDynamicData(params) {
            return typeof data === 'function' ? (data as any)(params) : data;
        },
        getContent(params) {
            return typeof content === 'function' ? content(params) : content;
        },
    });

    const original = page.getContent;
    page.getContent = spy(original.bind(page));

    const originalGetDynamicData = page.getDynamicData;
    page.getDynamicData = spy(originalGetDynamicData.bind(page));

    return page;
}

export function fakeStaticPage<REQUEST extends object, DATA>(
    { pattern, data, content, requestList }: {
        pattern: string;
        data: DATA | GetStaticData<REQUEST, DATA>;
        content: string | GetContent<REQUEST, DATA>;
        requestList: REQUEST[] | GetRequestList<REQUEST>;
    },
) {
    const page = new StaticPage<REQUEST, DATA>({
        self: new URL('file:///'),
        pattern,
        getRequestList(params) {
            return typeof requestList === 'function'
                ? requestList(params)
                : requestList;
        },
        getStaticData(params) {
            return typeof data === 'function' ? (data as any)(params) : data;
        },
        getContent(params) {
            return typeof content === 'function' ? content(params) : content;
        },
    });

    const original = page.getContent;
    page.getContent = spy(original.bind(page));

    const originalGetDynamicData = page.getStaticData;
    page.getStaticData = spy(originalGetDynamicData.bind(page));

    const originalGetRequestList = page.getRequestList;
    page.getRequestList = spy(originalGetRequestList.bind(page));

    return page;
}
