import type * as frugal from '../../packages/core/mod.ts';
import { cx } from '../../packages/loader_style/styled.ts';

import { red } from './main.style.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
    searchParams: string;
};

// For server side pages, we have an extra `searchParams` extracted from the url
// of the client request. The `request` object contains the url parameters.
export function getDynamicData(
    { request, searchParams }: frugal.GetDynamicDataParams<Request>,
): Data {
    return {
        title: `another article (${request.slug})`,
        content: 'this is another article',
        searchParams: searchParams.toString(),
    };
}

export const pattern = '/ssr/:slug.html';

export const self = new URL(import.meta.url);

export function getContent(
    { data, method }: frugal.GetContentParams<Request, Data>,
) {
    return `<html>
        <body>
            <p className=${cx(red)}>${method}</p>
            <h1>${data.title}</h1>
            <p>${data.content}</p>
            <p>${data.searchParams}</p>
        </body>
    </html>`;
}
