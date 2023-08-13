# Page descriptor

## Static and Dynamic page descriptor

There are two types of page descriptors:

- **Static Page Descriptor**: Frugal will build static page descriptors ahead of time (or just in time when needed). Once built, the page is served from cache, and you can refresh it at runtime if needed.
- **Dynamic Page Descriptor**: Frugal will generate them each time a request matching its route is received.

A page descriptor is static by default, but you can turn it into a dynamic page descriptor by adding `export const type = 'dynamic'` to the module.

## Routing

Unlike most frameworks, Frugal does not rely on file-based routing. Instead, you have to declare the route of the page in the page descriptor :

```ts
export const route = "/post/:tag/:page";
```

A route can include URL parameters with the [path-to-regexp](https://github.com/pillarjs/path-to-regexp) syntax. To a route correspond a path object containing the parameters of the URL. For the previous example, the path object would be `{ tag: string, page: string }`.

## Data fetching

A page descriptor can define multiple methods to do data fetching.

### With `getPaths`

For static pages, you can export a function `getPaths`. Frugal will call this method during the build to get the list of path objects to generate ahead of time. This method can be asynchronous, allowing you to query any data source you want.

This function is not required if the route has no parameters, and if you do not provide one, Frugal will use a function that returns only one empty path object.

```ts
import { PathList } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/page.ts";

export const route = "/post/:tag/:page";

export async function getPaths(): Promise<PathList<typeof route>> {
    const pageSize = 10;

    const paths: PathList<typeof route> = [];

    const tags = await queryAllTags();
    for (const tag of tags) {
        const count = await queryPostCountInTag(tag);
        for (let page = 0; page < count / pageSize; i++) {
            paths.push({ tag, page: String(page) });
        }
    }

    return paths;
}
```

By default, Frugal will enforce the list of paths you returned from `getPaths`. If `getPaths` did not return the path `{ tag: 'foo', page: '4' }`, then the URL `/post/foo/4` will return a 404.

But you can instruct Frugal not to enforce the list of paths with `export const strictPaths = false;`. If you do so, Frugal will still build the pages matching the path returned from `getPaths` at build time, but at runtime and for any request not matching a path previously built, Frugal will build it "just in time" and add it to the cache.

That way, you can build only a subset of the most visited path (to optimize build time) and let the less visited page be generated just in time.

#### Result

This method should return a list of path objects matching the route's parameters. The `PathList` type uses the route to infer the shape of the path object.

#### Parameters

The `generate` function takes a single parameter of type `GetPathsParams`.

```ts
type GetPathsParams = {
    resolve: (path: string) => string;
};

export type Phase = "build" | "refresh" | "generate";
```

##### `resolve`

This is a helper function to resolve any path relative to the root of the project. Since Frugal bundle your pages and output them somewhere else, relative path in your page won't be preserved unless you resolve them first with the `resolve` method.

### With `generate`

For static pages, you can export a function `generate`. Frugal will call this method to generate the page :

- at build time for each path generated with `getPaths`
- at request time on static page refresh (need some configuration)
- at request time for each path that was not generated during the build (need some configuration)

This function is not required, and if you do not provide one, Frugal use a function that returns an empty data object.

This is where you define all the data fetching logic to build the data object that will be passed to the `render` method. For example, you might query a database, call an API, or read a file.

```ts
import { StaticHandlerContext } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/page.ts";

export const route = "/post/:slug";

type Data = {
    title: string;
    content: string;
};

export async function generate({ path: { slug } }: StaticHandlerContext<typeof route>) {
    const post = await queryPostFromDatabase(slug);

    if (post === undefined) {
        throw new Error(`No post found with slug ${slug}`);
    }

    return new DataResponse<Data>({ data: post });
}
```

#### Result

This method should return either :

- a `DataResponse` object if you want to pass a data object to the `render` method
- an `EmptyResponse` object if you don't have any data to render

Both objects accept custom `headers` and a `status` that will be set on the response returned by the server.

> [!warn]
> Custom `headers` and `status` will be ignored by some exporters that generate static websites. Frugal needs a server to set them.

#### Parameters

The `generate` function takes a single parameter of type `StaticHandlerContext`. This type is generic with the first parameter, the route (used to infer the path object).

```ts
type StaticHandlerContext<PATH extends string> = {
    assets: Record<string, any>;
    descriptor: string;
    path: PathObject<PATH>;
    phase: Phase;
    publicdir: string;
    resolve: (path: string) => string;
};

export type Phase = "build" | "refresh" | "generate";
```

##### `assets`

This parameter contains all the static assets generated for each page descriptor by plugins. It's an object where the keys are the type of assets, and the value depends on each plugin.

##### `descriptor`

This is the unique id of the page descriptor.

##### `path`

This parameter contains the path object extracted from the route. With a route `/foo/:bar/:baz`, you'll get `{ bar:string, baz:string }`.

##### `phase`

This is the current phase of Frugal :

- `"build"` if the method was called during build time
- `"refresh"` if the method was called at request time (either for a page refresh or a generation just in time)

##### `publicdir`

This is the path to the public directory where frugal output static assets. You can use it if you need to output static assets of your own.

##### `resolve`

This is a helper function to resolve path relative to the root of the project. Since Frugal bundle your pages and output them somewhere else, relative path in your page won't be preserved unless you resolve them first with the `resolve` method.

### With a dynamic handler

For dynamic pages, you can export a dynamic handler `GET`, `POST`, `PUT`, `PATCH` and/or `DELETE` that will be called on request with the corresponding HTTP method.

This is where you define all the data fetching logic to build the data object that will be passed to the `render` method. For example, you might query a database, call an API, or read a file,.

```ts
import { DynamicHandlerContext } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/page.ts";

export const type = "dynamic";

export const route = "/post/:slug";

type Data = {
    title: string;
    content: string;
};

export async function GET({ path: { slug } }: DynamicHandlerContext<typeof route>) {
    const post = await queryPostFromDatabase(slug);

    if (post === undefined) {
        return new EmptyResponse({ status: 404 });
    }

    return new DataResponse<Data>({ data: post });
}
```

#### Result

This method should return either :

- a `DataResponse` object if you want to pass a data object to the `render` method
- an `EmptyResponse` object if you don't have any data to render

Both of those objects accept custom `headers` and a `status` that will be set on the response returned by the server.

> [!warn]
> Dynamic pages will be ignored by some exporters that generate static websites. Frugal needs a server to handle them.

#### Parameters

The dynamic handlers take a single parameter of type `DynamicHandlerContext`. This type is generic, with the route as the first parameter (used to infer the path object).

```ts
type DynamicHandlerContext<PATH extends string> = StaticHandlerContext<PATH extends string> & {
    request: Request;
    session?: PageSession;
    state: Record<string, unknown>;
};
```

It contains the same values as the `StaticHandlerContext` with extra values.

##### `request`

The current [Request object](https://developer.mozilla.org/fr/docs/Web/API/Request).

##### `session`

This parameter contains a [Session object](@@@) (if you configured Frugal to use sessions).

##### `state`

This object can be modified by any [middleware](@@@). If a middleware has to send some data to the page, it will be sent via the `state`. For exemple, the [CSRF middleware](@@@) will set a CSRF token in the `state` for pages that need to be protected.

## Markup generation with `render`

A page descriptor must export a function `render` that returns the page's markup. The `render` function is where you'd use a template engine (like Pug or with JS template strings) or a UI framework (like Preact or Svelte).

This function will receive the data object you returned from the data fetching methods like `generate` or any handler `GET`, `POST`, etc ...

```ts
import { RenderContext } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/page.ts";

type Data = {
    title: string;
    content: string;
};

export function render({ data }: RenderContext<"/blog/:slug", Data>) {
    return `<html>
        <body>
            <h1>${data.title}</h1>
            ${data.content}
        </body>
    </html>`;
}
```

#### Result

This method should return a string synchronously.

#### Parameters

The `render` function takes a single parameter of type `RenderContext`. This type is generic, with the route as the first parameter (used to infer the path object) and the shape of the data object as the second parameter.

```ts
type RenderContext<PATH extends string, DATA extends JSONValue = JSONValue> = {
    assets: Record<string, any>;
    data: DATA;
    descriptor: string;
    path: PathObject<PATH>;
    pathname: string;
    phase: Phase;
};

export type Phase = "build" | "refresh" | "generate";
```

##### `assets`

This parameter contains all the static assets generated for each page descriptor by plugins. It's an object where the keys are the type of assets, and the value depends on each plugin.

##### `data`

This parameter contains the data object return from the data fetching methods.

##### `descriptor`

This is the unique id of the page descriptor.

##### `path`

This parameter contains the path object extracted from the route. With a route `/foo/:bar/:baz`, you'll get `{ bar:string, baz:string }`.

##### `pathname`

This is the current pathname (the route with parameters replaced with current values).

##### `phase`

This is the current phase of Frugal :

- `"build"` if the method was called at build time for a static page
- `"generate"` if the method was called at request time for a dynamic page
- `"refresh"` if the method was called at request time for a static page (either for a page refresh or a generation just in time)

## Hybrid Page

You can define a hybrid page descriptor that will be both static and dynamic :

- For GET request, you'll get the cached static page
- For other HTTP methods, you'll get a dynamic response

To do so, you write your page as a static page and export a `POST`, `PATCH`, `PUT` and/or `DELETE` handler :

```ts
import { DynamicHandlerContext, HybridHandlerContext } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/page.ts";

export const route = "/post/:slug";

type Data = {
    post: {
        title: string;
        content: string;
    };
    message?: string;
};

export async function generate({ path: { slug }, session }: HybridHandlerContext<typeof route>) {
    const post = await queryPostFromDatabase(slug);

    if (post === undefined) {
        throw new Error(`No post found with slug ${slug}`);
    }

    return new DataResponse<Data>({ data: post, message: session?.get("message") });
}

export async function POST({ path: { slug }, request, session }: DynamicHandlerContext<typeof route>) {
    try {
        const post = getPostFromRequest(request);

        await persistPostInDatabase(post);

        session.set("message", { type: "success", content: "Post saved" });
    } catch (error) {
        session.set("message", { type: "failure", content: error.message });
    }

    return new EmptyResponse<Data>({
        status: 303,
        forceDynamic: true,
        headers: {
            "Location": request.url,
        },
    });
}
```

We have a hybrid page :

- a GET request will return the page from the cache. The page was built by calling the `generate` method with a `StaticHandlerContext` without any `session`. Therefore `message` will be `undefined`. Suppose the page contains a form submitted with a POST method.
- a POST request will call the `POST` handler and redirect to the same URL with a GET method when done (via a [303 See Other](https://developer.mozilla.org/fr/docs/Web/HTTP/Status/303)) while forcing Frugal to handle this GET method dynamically (via `forceDynamic: true`).
- The user is redirected to the same URL with a GET request that forces a dynamic page generation. The `generate` method is called dynamically with the `session` of the user. The `generate` method can get the message that was set during the `POST` and display it to the user.
