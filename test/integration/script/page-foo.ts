import * as page from '../../../page.ts';

import './scripts/foo.script.ts';
import './component.ts';
import './scripts/shared.script.ts';

type Data = {
  title: string;
  content: string;
};

async function getData() {
  const data = await Deno.readTextFile(
    new URL('../../../../data.json', import.meta.url),
  );
  return JSON.parse(data)['foo'];
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

export const pattern = '/foo/:slug';

export const self = import.meta.url;

export function getContent({ assets, descriptor }: page.GetContentContext<
  Data,
  typeof pattern
>) {
  const scriptSrc = assets['script'][descriptor];

  return `<html>
    <head>
        <title>foo</title>
    </head>
    <body>
        <div id="log"></div>
        <script type="module" src="${scriptSrc}"></script>
    </body>
</html>`;
}
