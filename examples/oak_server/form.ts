import * as frugal from '../../packages/core/mod.ts';
import * as oak from '../../dep/oak.ts';
import { cx } from '../../packages/loader_style/styled.ts';

import { red } from './main.style.ts';

type Request = {};

type Data = {
    title: string;
    content: string;
};

export const self = new URL(import.meta.url);

export const pattern = '/form/static.html';

export function getRequestList() {
    return [{}];
}

export function getStaticData(): Data {
    return {
        title: `title`,
        content: 'content',
    };
}

export async function postDynamicData(
    params: frugal.PostDynamicDataParams<Data, oak.BodyForm>,
) {
    const form = await params.body.value;
    const data = await getStaticData();
    return {
        ...data,
        content: form.get('content') ?? data.content,
    };
}

export function getContent(
    { data, method, loaderContext }: frugal.GetContentParams<Request, Data>,
) {
    const styleUrl = loaderContext.get('style');

    return `<html>
        <head>
            <link rel="stylesheet" href="${styleUrl}" />
        </head>
        <body>
            <p className=${cx(red)}>${method}</p>
            <h1>${data.title}</h1>
            <p>${data.content}</p>
            <form method="POST">
                <input type="text" name="content">
                <button>Submit</button>
            </form>
        </body>
    </html>`;
}
