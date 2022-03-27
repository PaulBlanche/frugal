import type * as frugal from '../../../packages/core/mod.ts';

import { article } from './article.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

async function getData() {
    const data = await Deno.readTextFile(
        new URL('./data.json', import.meta.url),
    );
    return JSON.parse(data)['foo'];
}

export async function getRequestList(): Promise<Request[]> {
    const data = await getData();
    return Object.keys(data).map((key) => ({ slug: key }));
}

export async function getStaticData(
    { request }: frugal.GetStaticDataParams<Request>,
): Promise<Data> {
    const data = await getData();

    if (!(request.slug in data)) {
        throw Error();
    }

    return data[request.slug];
}

export const pattern = 'foo/:slug.html';

export const self = new URL(import.meta.url);

export function getContent({ data }: frugal.GetContentParams<Request, Data>) {
    return `<html>
        <head>
            <title>foo</title>
        </head> 
        <body>
            ${article(data.title, data.content)}
        </body>
    </html>`;
}
