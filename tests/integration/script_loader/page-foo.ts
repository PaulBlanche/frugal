import type * as frugal from '../../../packages/core/mod.ts';
import type { Generated } from '../../../packages/loader_script/mod.ts';

import './scripts/foo.script.ts';
import './component.ts';
import './scripts/shared.script.ts';

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

export function getContent(
    { loaderContext, entrypoint }: frugal.GetContentParams<Request, Data>,
) {
    const scriptBodyGenerated = loaderContext.get<Generated>('script');

    const esmScriptSrc = scriptBodyGenerated?.[String(entrypoint)]?.['body'];

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
