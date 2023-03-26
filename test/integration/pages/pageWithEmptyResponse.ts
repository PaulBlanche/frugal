import { EmptyResponse, GetContentContext } from '../../../page.ts';

export const self = import.meta.url;

export const pattern = '/';

type Data = { foo: string };

export function GET() {
    return new EmptyResponse({
        status: 200,
        headers: {
            'my-header': 'quux',
        },
    });
}

export function getContent({ data }: GetContentContext<Data>) {
    return `${data.foo}`;
}
