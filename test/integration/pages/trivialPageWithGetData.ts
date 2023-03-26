import { DataResponse, GetContentContext } from '../../../page.ts';

export const self = import.meta.url;

export const pattern = '/';

type Data = { foo: string };

export function GET() {
    return new DataResponse({ foo: 'bar' }, {
        status: 204,
        headers: {
            'my-header': 'quux',
        },
    });
}

export function getContent({ data }: GetContentContext<Data>) {
    return `${data.foo}`;
}
