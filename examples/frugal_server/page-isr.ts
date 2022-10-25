import type * as frugal from '../../packages/core/mod.ts';
import { cx } from '../../packages/loader_style/styled.ts';

import { red } from './main.style.ts';

type Path = { slug: string };

type Data = {
    title: string;
    content: string;
};

export function getPathList(): Path[] {
    return [{ slug: '1' }];
}

export function getStaticData(
    { path }: frugal.GetStaticDataContext<Path>,
): frugal.DataResult<Data> {
    if (path.slug === '1') {
        return {
            data: {
                title: 'first article !',
                content: 'this is the first article',
            }
        };
    }
    return {
        data: {
            title: `another article ${path.slug}`,
            content: 'this is another article',
        }
    };
}

export const pattern = '/isr/:slug';

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
        </body>
    </html>`;
}
