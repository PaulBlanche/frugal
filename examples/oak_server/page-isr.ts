import type * as frugal from '../../packages/core/mod.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

export function getRequestList(): Request[] {
    return [{ slug: '1' }];
}

export function getStaticData(
    { request }: frugal.GetStaticDataParams<Request>,
): Data {
    if (request.slug === '1') {
        return {
            title: 'first article !',
            content: 'this is the first article',
        };
    }
    return {
        title: `another article ${request.slug}`,
        content: 'this is another article',
    };
}

export const pattern = '/isr/:slug.html';

export function getContent({ data }: frugal.GetContentParams<Request, Data>) {
    return `<html>
        <body>
            <h1>${data.title}</h1>
            <p>${data.content}</p>
        </body>
    </html>`;
}
