import { DataResponse, GetContentContext, PathList, StaticDataContext } from '../../../page.ts';

export const self = import.meta.url;

export const pattern = '/:foo';

export function getPathList(): PathList<typeof pattern> {
    return [{ foo: 'foo' }, { foo: 'bar' }];
}

type Data = { foo: string };

export function GET(context: StaticDataContext<typeof pattern>) {
    if (context.path.foo === 'foo') {
        return new DataResponse({ foo: 'Hello foo' }, {
            status: 201,
            headers: {
                'x-foo': 'foo',
            },
        });
    }
    if (context.path.foo === 'bar') {
        return new DataResponse({ foo: 'Hello bar' }, {
            status: 202,
            headers: {
                'x-foo': 'bar',
            },
        });
    }
}

export function getContent({ data }: GetContentContext<Data>) {
    return `data: ${data.foo}`;
}
