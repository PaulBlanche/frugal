import type * as frugal from '../../../packages/core/mod.ts';
import type { Generated } from '../../../packages/loader_script/mod.ts';

import './scripts/shared.script.ts';
import './scripts/bar.script.ts';
import './component.ts';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

async function getData() {
    const data = await Deno.readTextFile(
        new URL('./data.json', import.meta.url),
    );
    return JSON.parse(data)['bar'];
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

export const pattern = 'bar/:slug.html';

export const self = new URL(import.meta.url);

export function getContent(
    { loaderContext, entrypoint }: frugal.GetContentParams<Request, Data>,
) {
    const scriptBodyGenerated = loaderContext.get<Generated>('script_body');

    const esmScriptSrc = scriptBodyGenerated[String(entrypoint)]['esm'];

    return `<html>
    <head>
        <title>bar</title>
    </head>
    <body>
        <div id="log"></div>
        <script module src="${esmScriptSrc}"></script>
    </body>
</html>`;
}
