import type * as frugal from '../../packages/core/mod.ts';
import * as oak from '../../dep/oak.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

type PostBody = oak.BodyForm;

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

export const self = new URL(import.meta.url);

export function getContent(
    { data, method }: frugal.GetContentParams<Request, Data>,
) {
    return `<html>
        <body>
            <p>${method}</p>
            <h1>${data.title}</h1>
            <p>${data.content}</p>
            <form method="POST">
                <input type="text" name="content">
                 <button>Submit</button>
            </form>
        </body>
    </html>`;
}
