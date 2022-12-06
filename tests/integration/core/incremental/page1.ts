import * as mock from '../../../../dep/std/testing/mock.ts';

import * as frugal from '../../../../packages/core/mod.ts';

import { store } from './store.ts';

export const page1 = {
    type: 'static' as const,
    pattern: 'page1/:id.html',
    self: new URL(import.meta.url),
    getContent: mock.spy(
        async (params: frugal.GetContentContext<number, 'page1/:id.html'>) => {
            return (await store())[0][params.path.id].content;
        },
    ),
    getPathList: mock.spy(() => {
        return [{ id: '1' }, { id: '2' }];
    }),
    GET: mock.spy(
        async (params: frugal.StaticDataContext<'page1/:id.html'>) => {
            return {
                data: (await store())[0][params.path.id].data,
                headers: (await store())[0][params.path.id].headers,
            };
        },
    ),
};
