import * as page from '../../../page.ts';

// @deno-types="../../../css-module.d.ts"
import bar from './styles/bar.module.css';
// @deno-types="../../../css-module.d.ts"
import shared from './styles/shared.module.css';
import './styles/global.css';

type Data = {
    title: string;
    content: string;
};

async function getData() {
    const data = await Deno.readTextFile(
        new URL('../../../data.json', import.meta.url),
    );
    return JSON.parse(data)['bar'];
}

export async function getPathList(): Promise<page.PathList<typeof pattern>> {
    const data = await getData();
    return Object.keys(data).map((key) => ({ slug: key }));
}

export async function GET(
    { path }: page.StaticDataContext<typeof pattern>,
): Promise<page.DataResponse<Data>> {
    const data = await getData();

    if (!(path.slug in data)) {
        throw Error();
    }

    return new page.DataResponse(data[path.slug]);
}

export const pattern = '/bar/:slug';

export const self = import.meta.url;

export function getContent({ assets, descriptor }: page.GetContentContext<
    Data,
    typeof pattern
>) {
    const styleHref = assets['style'][descriptor];

    return `<html>
    <head>
        <title>bar</title>
        <link rel="stylesheet" href="${styleHref}" />
    </head>
    <body>
        <div id="page" class="${bar['bar']}">page</div>
        <div id="shared" class="${shared['shared']}">shared</div>
        <div id="global" class="global">global</div>
    </body>
</html>`;
}
