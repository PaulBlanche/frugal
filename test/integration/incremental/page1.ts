import { store } from './store.ts';
import { DataResponse, GetContentContext, StaticDataContext } from '../../../page.ts';

export const self = import.meta.url;

export const pattern = '/page1/:id';

export function getPathList() {
    return [{ id: '1' }, { id: '2' }];
}

export async function GET({ path }: StaticDataContext<typeof pattern>) {
    const dataStore = await store();
    const pageData = dataStore[0];
    return new DataResponse(pageData[path.id].data, {
        headers: pageData[path.id].headers,
    });
}

export function getContent(
    { data, path }: GetContentContext<number, typeof pattern>,
) {
    return `data : ${data}, path: ${path}`;
}
