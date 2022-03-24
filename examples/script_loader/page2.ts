import type * as frugal from '../../packages/core/mod.ts';
import type { Generated } from '../../packages/loader_script/mod.ts';

import './foo.script.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

export function getRequestList(): Request[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

export function getStaticData(
    { request }: frugal.GetStaticDataParams<Request>,
): Data {
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

export const pattern = '/page2/:slug.html';

export const self = new URL(import.meta.url);

export function getContent(
    { data, loaderContext, entrypoint }: frugal.GetContentParams<Request, Data>,
) {
    const bodyScriptSrc =
        loaderContext.get<Generated>('script-body')[String(entrypoint)]['esm'];

    return `<html>
    <body>
        <h1>${data.title}</h1>
        <p>${data.content}</p>    
        <script module src="${bodyScriptSrc}"></script>
    </body>
</html>
`;
}
