# Dynamic Page

> ⚠️ In order to use dynamic pages, you will need a server with `frugal_server`. You must use it (or developp your own server integration) to have dynamic pages.

A dynamic page descriptor is an object with some properties and method :

- a `pattern` string, that will be used for routing. For dynamic pages, this `pattern` will be used to generate the server route and to extract the _path object_ from the url. The `pattern` uses the [`path-to-regexp` syntax](https://github.com/pillarjs/path-to-regexp)
- a `getDynamicData` function that will return the _data object_ necessary to render the page for a given _path object_. In spirit, this is similar to `getServerSideProps` in Next.js.
- a `getContent` function that will return the rendered page as a string given a _data object_. This is similar to the exported component in Next.js
- a `self` URL of the module. Unless you know what you are doing, it should always be `new URL(import.meta.url)`
- an optionnal [`handlers` object](/docs/concepts/page-descriptor/handlers)

A basic example of a dynamic page :

```tsx
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';
import { queryMyApiForDataGivenSlug } from './api.ts';

type Path = { slug: string };

type Data = {
    title: string;
    content: string;
};

export const pattern = '/:slug';

export function getDynamicData(
    request: Request,
    { path }: frugal.GetDynamicDataContext<Path>,
): frugal.DataResult<Data> {
    return { data: await queryMyApiForDataGivenSlug(path.slug) };
}

export function getContent({ data }: frugal.GetContentParams<Path, Data>) {
    return `<html>
        <body>
            <h1>${data.title}</h1>
            <p>${data.content}</p>
        </body>
    </html>`;
}

export const self = new URL(import.meta.url);
```

Given this page descriptor, frugal will generate a route `/:slug`. On each request, the server will query the api with the slug extracted from the url, render the page and send it back to the user.

## Headers

If you want the response to contain specific headers, you can return them from the `getDynamicData` function :

```tsx
//...

export function getDynamicData(
    request: Request,
    { path }: frugal.GetDynamicDataContext<Path>,
): frugal.DataResult<Data> {
    return {
        data: await queryMyApiForDataGivenSlug(path.slug),
        headers: {
            'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
    };
}
```

The server will add them in the response.

> ℹ️ The server handles etag generation for you, but if you want to override them, simply add them to the `headers` object.
