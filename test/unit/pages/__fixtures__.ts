import { EmptyResponse } from '../../../src/page/FrugalResponse.ts';
import * as page from '../../../src/page/Page.ts';
import * as descriptor from '../../../src/page/PageDescriptor.ts';

export function fakeDynamicPage<DATA = unknown, PATH extends string = string>({
    self = 'file:///',
    pattern = '',
    getContent = () => '',
    GET = () => new EmptyResponse(),
    ...rest
}: Partial<descriptor.DynamicPageDescriptor<DATA, PATH>> = {}) {
    return new page.DynamicPage<DATA, PATH>({
        type: 'dynamic',
        self,
        pattern,
        getContent,
        GET,
        ...rest,
    });
}

export function fakeStaticPage<DATA = unknown, PATH extends string = string>({
    self = 'file:///',
    pattern = '',
    getContent = () => '',
    ...rest
}: Partial<descriptor.StaticPageDescriptor<DATA, PATH>> = {}) {
    return new page.StaticPage<DATA, PATH>({
        self,
        pattern,
        getContent,
        ...rest,
    });
}
