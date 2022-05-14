import type * as frugal from '../../packages/core/mod.ts';
import { cx } from '../../packages/loader_style/styled.ts';

import { red } from './main.style.ts';

type Path = { slug: string };

type Data = {
    title: string;
    content: string;
    searchParams: string;
};

// For server side pages, we have an extra `searchParams` extracted from the url
// of the client request. The `request` object contains the url parameters.
export function getDynamicData(
    { path, request }: frugal.GetDynamicDataParams<Path, unknown>,
): Data {
    return {
        title: `another article (${path.slug})`,
        content: 'this is another article',
        searchParams: request.url.searchParams.toString(),
    };
}

export const pattern = '/ssr/:slug.html';

export const self = new URL(import.meta.url);

export function getContent(
    { data, method, loaderContext }: frugal.GetContentParams<Path, Data>,
) {
    const styleUrl = loaderContext.get('style');

    return `<html>
        <head>
            <link rel="stylesheet" href="${styleUrl}"></link>
        </head>
        <body>
            <p class=${cx(red)}>${method}</p>
            <h1>${data.title}</h1>
            <p>${data.content}</p>
            <p>${data.searchParams}</p>
        </body>
    </html>`;
}
