# Dynamic Page

A dynamic page descriptor is an object with some properties and method :

- a `pattern` string, that will be used for routing. For static pages, this `pattern` will be used to generate the server route and to extract the _request object_ from the url.
- a `getDynamicData` function that will return the _data object_ necessary to render the page for a given _request object_. In spirit, this is similar to `getStaticData` in Next.js
- a `getContent` function that will return the rendered page as a string given a _data object_. This is similar to the exported component in Next.js
- a `self` URL of the module. Unless you know what you are doing, it should always be `new URL(import.meta.url)`

A basic example of a static page :

```tsx
import type * as frugal from '...';

type Request = { slug: string };

type Data = {
    title: string;
    content: string;
};

export const pattern = '/:slug';

export function getDynamicData(
    { request }: frugal.GetStaticDataParams<Request>,
): Data {
    return await queryMyApiFroDataGivenSlug(request.slug);
}

export function getContent({ data }: frugal.GetContentParams<Request, Data>) {
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
