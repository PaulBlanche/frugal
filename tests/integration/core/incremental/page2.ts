import * as mock from '../../../../dep/std/testing/mock.ts';

import * as frugal from '../../../../packages/core/mod.ts';

import { store } from './store.ts';

export const page2 = {
    pattern: 'page2/:id.html',
    self: new URL(import.meta.url),
    getContent: mock.spy(
        async (params: frugal.GetContentParams<{ id: string }>) => {
            return (await store())[1][params.path.id].content;
        },
    ),
    getPathList: mock.spy(() => {
        return [{ id: '1' }, { id: '2' }];
    }),
    getStaticData: mock.spy(
        async (params: frugal.GetStaticDataContext<{ id: string }>) => {
            return {
                data: (await store())[1][params.path.id].data,
                headers: (await store())[1][params.path.id].headers,
            };
        },
    ),
};
