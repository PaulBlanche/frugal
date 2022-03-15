import type * as frugal from '../../packages/core/mod.ts';

import './foo.script.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

export function getRequestList(): Request[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

export function getData({ request }: frugal.GetDataParams<Request>): Data {
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

export const pattern = '/page2/:slug.html'

export function getContent(
    { data, context }: frugal.GetContentParams<Request, Data>,
) {
    const entrypoint = new URL(import.meta.url).toString();
    const bodyScript = context['script-body'][entrypoint];

    return `<html>
    <body>
        <h1>${data.title}</h1>
        <p>${data.content}</p>    
        <script module src="${bodyScript['esm']}"></script>
    </body>
</html>
`;
}
