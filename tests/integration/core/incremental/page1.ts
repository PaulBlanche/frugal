import * as mock from '../../../../dep/std/mock.ts';

import * as frugal from '../../../../packages/core/mod.ts';

import { store } from './store.ts';

export const page1 = {
    pattern: 'page1/:id.html',
    self: new URL(import.meta.url),
    getContent: mock.spy(
        async (params: frugal.GetContentParams<{ id: string }>) => {
            return (await store())[0][params.path.id].content;
        },
    ),
    getPathList: mock.spy(() => {
        return [{ id: '1' }, { id: '2' }];
    }),
    getStaticData: mock.spy(
        async (params: frugal.GetStaticDataContext<{ id: string }>) => {
            return {
                data: (await store())[0][params.path.id].data,
                headers: (await store())[0][params.path.id].headers,
            };
        },
    ),
};
