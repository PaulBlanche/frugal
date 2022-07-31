import type * as frugal from '../../packages/core/mod.ts';

import { article } from './article.ts';

type Path = { slug: string };

type Data = {
    title: string;
    content: string;
};

// We will generate two html pages with this page descriptor, with two different
// slugs.
export function getPathList(): Path[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

// For each request, we generate the data needed to render the page
export function getStaticData(
    { path }: frugal.GetDataContext<Path>,
): frugal.DataResult<Data> {
    if (path.slug === 'article-1') {
        return {
            data: {
                title: 'first article !',
                content: 'this is the first article',
            }
        };
    }
    return {
        data: {
            title: 'another article',
            content: 'this is another article',
        }
    };
}

// the generated pages will have the url `/article-1.html` and `article-2.html`.
export const pattern = '/:slug.html';

export const self = new URL(import.meta.url);

// For each data generated from a request, we generate the html of the page.
// Here we use template string, but you can use any templating language that
// can return a html string.
export function getContent({ data }: frugal.GetContentParams<Path, Data>) {
    return `<html>
        <body>
            ${article(data.title, data.content)}
        </body>
    </html>`;
}
