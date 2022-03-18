import type * as frugal from '../../packages/core/mod.ts';

import { article } from './article.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

export function getRequestList(): Request[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

export function getStaticData({ request }: frugal.GetStaticDataParams<Request>): Data {
    if (request.slug === 'article-1') {
        return {
            title: 'first article !',
            content: 'this is the first article',
        };
    }
    return {
        title: 'another article',
        content: 'this is another article',
    };
}

export const pattern = '/:slug.html'

export function getContent({ data }: frugal.GetContentParams<Request, Data>) {
    return `<html>
        <body>
            ${article(data.title, data.content)}
        </body>
    </html>`;
}
