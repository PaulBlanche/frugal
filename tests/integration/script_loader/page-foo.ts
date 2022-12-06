import type * as frugal from '../../../packages/core/mod.ts';
import type { Generated } from '../../../packages/loader_script/mod.ts';

import './scripts/foo.script.ts';
import './component.ts';
import './scripts/shared.script.ts';

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

export async function getPathList(): Promise<
    frugal.PathList<typeof pattern>
> {
    const data = await getData();
    return Object.keys(data).map((key) => ({ slug: key }));
}

export async function GET(
    { path }: frugal.StaticDataContext<typeof pattern>,
): Promise<frugal.DataResult<Data>> {
    const data = await getData();

    if (!(path.slug in data)) {
        throw Error();
    }

    return { data: data[path.slug] };
}

export const type = 'static' as const;

export const pattern = 'foo/:slug.html';

export const self = new URL(import.meta.url);

export function getContent(
    { loaderContext, descriptor }: frugal.GetContentContext<
        Data,
        typeof pattern
    >,
) {
    const scriptBodyGenerated = loaderContext.get<Generated>('script');

    const esmScriptSrc = scriptBodyGenerated?.[String(descriptor)]?.['body'];

    return `<html>
    <head>
        <title>foo</title>
    </head>
    <body>
        <div id="log"></div>
        <script type="module" src="${esmScriptSrc}"></script>
    </body>
</html>`;
}
