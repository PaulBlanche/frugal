# Static Page

A static page descriptor is an object with some properties and method :

- a `getPathList` function that will return the list of _path object_ that will be used to generate each page. A list of slugs and locale for example. In spirit, this is similar to `getStaticPath` in Next.js
- a `pattern` string, that will be used for routing. For static pages, this `pattern` will be used to generate the url of the page from the _path object_ with `path-to-regexp`. Keep in mind there should be a 1-to-1 correspondance between the _path object_ and the `pattern`.
- a `getStaticData` function that will return the _data object_ for a given _path object_. In spirit, this is similar to `getStaticProps` in Next.js
- a `getContent` function that will return the rendered page as a string given a _data object_. This is similar to the exported component in Next.js
- a `self` URL of the module. Unless you know what you are doing, it should always be `new URL(import.meta.url)`

A basic example of a static page :

```tsx
import type * as frugal from '...';

type Path = { slug: string };

type Data = {
    title: string;
    content: string;
};

const store = {
    'article-1': {
        title: 'first article !',
        content: 'this is the first article',
    },
    'article-2': {
        title: 'another article',
        content: 'this is another article',
    },
};

export function getPathList(): Path[] {
    return [{ slug: 'article-1' }, { slug: 'article-2' }];
}

export const pattern = '/:slug';

export function getStaticData(
    { path }: frugal.GetStaticDataParams<Path>,
): Data {
    return store[path.slug];
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

Given this page descriptor, frugal will generate two html files: `/article-1/index.html` and `/article-2/index.html`. Frugal server is able to handle file named `index.html`, giving you urls : `/article-1` and `article-2`
