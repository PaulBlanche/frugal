# Create a static page

## Frugal configuration

First you need to write some configuration module for frugal. In a module (the convention is `/frugal.config.ts`, but you can use any other path) export a simple config object :

```ts
import type * as frugal from 'https://deno.land/x/frugal/core.ts';

const self = new URL(import.meta.url);

export const config: frugal.Config = {
    self,
    outputDir: './dist',
};
```

The `self` value will be used to define the `root` of your project. Since it is conventional to have the configuration at the root of the project, `self` should be the absolute url of the module. Every relative path in the config will be resolved relatively to the root of your project.

The `outputDir` value is the path where frugal will generate your site. Inside this directory frugal will create a `public` directory that can be served by a server like `nginx` or `Apache HTTP Server`.

## Static page descriptor

In a module (`/pages/posts/detail.ts` for example), create a [static page descriptor](/docs/api/01-page-descriptor) :

```tsx
import type * as frugal from 'https://deno.land/x/frugal/core.ts';
import { queryPost, queryPostList } from './api.ts';
import { post } from './component/post.ts';

export const pattern = '/post/:id';

type Path = { id: string };

export async function getPathList(): Promise<Path[]> {
    const postList = await queryPostList();
    return postList.map((post) => ({
        id: post.id;
    }));
}

export async function getStaticData(
    context: GetStaticDataContext<Path>,
): Promise<DataResult<Post>> {
    const post = await queryPost(context.path.id);
    return { data: post };
}

export function getContent(params: frugal.GetContentParams<Path, Post>) {
    return `<html>
        <body>
            ${post(params.data)}
        </body>
    </html>`;
}

export const self = new URL(import.meta.url);
```

The `pattern` value defines the route of your page. You can use url parameters with `path-to-regexp` syntax.

The `getPathList` method should return a list of parameter object that will be used to generate a list of path with `pattern`. If you use a headless CMS for exemple, this is typically where you'll fetch the list of entities you want to generate pages for. This function can be async.

The `getStaticData` method will be called for each path returned by the `getPathList` and should return a data object that will be consumed to produce the view. Everything you need from a distant source (database, file, api) to generate your page, you should fetch here. This function can be async

The `getContent` method will be called with each data object returned by `getStaticData`, and should return the full html of your page. This function can be async.

The `self` constant should be the absolute url of the module. Unless you really know what you are doing, it should always be `new URL(import.meta.url)`.

After creating the page descriptor, we need to register it in `/frugal.config.ts` :

```ts
//...
import * as postDetail from './pages/posts/detail.ts';

export const config: frugal.Config = {
    //...
    pages: [
        frugal.page(postDetail),
    ],
};
```

The `pages` array contains all page descriptors you wish to include in your site.

## Build the website

With only static pages, frugal will effectively be a Static Site Generator (SSG), with only a build step. In a module `/build.ts` add the following code :

```ts
import { config } from './frugal.config.ts';
import { build } from 'https://deno.land/x/frugal/core.ts';

await build(config);
```

Running this module will generates all pages in the `/public` directory. Frugal build is incremental. This means that frugal will skip building a page if **both** those conditions are true :

- the code of the page (and its dependencies) did not change
- the data of the page did not change

This means that frugal only ever do the minimal amount of work needed to update your site. If you change only 3 pages, frugal will only build those 3 pages.

[warn]> You should fetch all your data in the `getStaticData` function and never in `getContent`. If you fetch in `getContent`, frugal will never be able to know if the data has changed and needs to be rebuilt.
