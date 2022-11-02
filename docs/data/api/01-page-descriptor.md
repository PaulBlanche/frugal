# Page Descriptor

## Markup generation with `getContent`

A page descriptor must export a function `getContent` that returns the markup of the page. This is where you use a template engine (like pug, or simple js template strings) or a UI framework (like preact or vue).

This function will receive the data object you returned in data fetching methods (`getStaticData` or `getDynamicData`)

```ts
export function getContent(params: frugal.GetContentParams<Path, Post>) {
    return `<html>
        <body>
            ${post(params.data)}
        </body>
    </html>`;
}
```

You can return a `string` or a `Promise<string>` from the method, but it is not recommended to fetch any data (read a file, call an api, read from a database, ...) within the `getContent` method. It will work, but frugal won't be able to examine your data and determine if it has changed since the last run.

## Page url

A page descriptor must export a `pattern` value that will be used to generates the actual path for the page. This `pattern` uses `path-to-regexp` syntax :

```ts
export const pattern = '/post/:id';
```

This `pattern` defines the shape of the path object : each property in the path will match with a parameter in the `pattern`.

## Data fetching

A page descriptor can define multiple methods that do data fetching

### `getStaticData` method

If you export a function `getStaticData`, frugal will generate the page :

- at build time for each path generated with `getPathList`
- at runtime on [static page refresh](??)
- at runtime for each path that was not generated during the build

The method is where you define all the data fetching logic. You might query a database, call an api or read a file for example.

The method will be called with a path object (generated from the `pattern` value) :

```ts
export const pattern = '/post/:id';

export async function getStaticData(
    { path }: GetStaticDataContext<{ id: string }>,
): Promise<DataResult<Post>> {
    const post = await queryPost(path.id);
    return { data: post };
}
```

Even if it is not strictly required, it is preferable to keep the `data` object json-serializable. If you use preact islands, it is strictly required.

### `getDynamicData` method

If you export a function `getDynamicData`, frugal will generate the page at runtime on each request. Those pages will not be generated unless you use frugal as a server.

As with `getStaticData`, the method is where you define all the data fetching logic. You might query a database, call an api or read a file for example. Keep in mind that this method will be called on each request, so keep it fast.

The method will be called with the request and a path object (generated from the `pattern` value) :

```ts
export const pattern = '/posts';

export async function getDynamicData(
    request: Request,
    context: GetStaticDataContext,
): Promise<DataResult<Post[]>> {
    const searchParams = new URL(request.url).searchParams;
    const postList = await queryPostList(searchParams.get('page'));
    return { data: postList };
}
```

### `getPathList` method

This method is used with `getStaticData`. This method will be called at build time and should return the list of path object frugal should generate :

```ts
export const pattern = '/post/:id';

export async function getPathList(): Promise<{ id: string }[]> {
    const postList = await queryMostSeenPosts();
    return postList.map((post) => ({
        id: post.id;
    }));
}
```

You don't have to return the complete list of paths, you could return only a subset (the most frequently visited ones for example) to save time during the build, but still have a cache hit on the frequently visited pages.

If the method is not exported, frugal will not generate anything at build time (and if you use frugal as a server, the pages will be generated on-the-fly at runtime).

### `self` value

Unless you know what you are doing, this value should always be :

```ts
export const self = new URL(import.meta.url);
```

This value is needed because frugal works on the dependency graph of your project. To avoid doing analysis on parts of the graph that are not relevant, frugal only does it on your page descriptor. To do so, frugal needs to have the url of the module to parse it.

The `self` value contains the absolute url of the page descriptor, that frugal can parse to analyse its dependency graph.

## Headers and status control

Instead of a `data` property you can return a `status` number. This can be used to issue redirections or return `404` in certain situations.

In addition to the `data` or `status` property, you can add a `headers` property.

[info]> The server handles etag generation for you, but if you want to override them, simply add them to the `headers` object.

[warn]> This functionality will only work if you serve your pages with frugal

## Handlers

For a dynamic or static pages the `getStaticData`/`getDynamicData` method describes how the page should react to a `GET` request. The `handlers` object describes how the page should react to a `POST`, `PUT`, `PATCH` or `DELETE` request :

```ts
import type * as frugal from 'https://deno.land/x/frugal/core.ts';
import * as form from './form.ts';
//...

export function getStaticData(
    { path }: frugal.GetDynamicDataContext<Path>,
): frugal.DataResult<Data> {
    return {
        data: { method: 'GET' },
    };
}

export const handlers = {
    POST: (request: Request) => {
        return {
            data: { method: 'POST' },
        };
    },
};
```

Each handler has the same signature as `getDynamicData`
