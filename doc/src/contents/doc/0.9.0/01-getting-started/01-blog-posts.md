# Blog posts

For our blog, we need to have a "blog post page" that displays a given blog post. We want this page to be static and generated for each of our posts.

## Static page with data fetching

As with our first page, we will create a file, `pages/posts.ts`. To display posts, first, we need some data. As a starting point, we will use an array :

```ts filename=pages/posts.ts
type Data = { 
    slug: string; 
    title: string; 
    content: string;
}

const POSTS: Data[] = [
    {
        slug: "hello-world",
        title: "Hello world",
        content: "<p>This is my first post ever</p>"
    },
    {
        slug: "second-post",
        title: "Second post",
        content: "<p>And a second post !</p>"
    },
]
```

Now we need to define the pattern of URLs generated from the page. We would like URLs like `/post/hello-world` and `/post/second-post` for our posts. To do so, we will use the pattern `/post/:slug` :

```ts filename=pages/posts.ts lines=[7]
...

const POSTS: Data[] = [
    ...
]

export const pattern = '/post/:slug';
```

To generate an html page for each post, Frugal needs you to define a `getPaths` method (called at build time) that will return the list of all possible "path objects": with a pattern `/post/:slug`, the path object will have the shape `{ slug: string }`. The `getPaths` method has to return the list of each slug:

```ts filename=pages/posts.ts lines=[1,7-9]
import { PathList } from "frugal/page.ts"

...

export const pattern = '/post/:slug';

export function getPaths(): PathList<typeof pattern> {
    return POSTS.map((post) => ({ slug: post.slug }))
}
```

> [!tip]
> The `PathList` type will infer the shape of the path objects from the `pattern` for you. That's why you need the `PathList<typeof pattern>` type.

We simply have to map over an array, but any asynchronous operations can happen here: reading from a file or a database, calling an API, etc...

Then, we define the data fetching method `generate`. This method is called at build time, and this is where - given the URL parameters - we query any data needed to build the page :

```ts filename=pages/posts.ts lines=[2,4,13-15]
import { 
    DataResponse, 
    PathList, 
    StaticHandlerContext 
} from "frugal/page.ts"

...

export function getPaths(): PathList<typeof pattern> {
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function generate({ path: { slug } }: StaticHandlerContext<typeof pattern>) {
    return new DataResponse<Data>({ data: POSTS.find(post => post.slug === slug) })
}
```

Here we search an array, but again any asynchronous operations can happen here.

The consolidated data that was fetched is returned in a `DataResponse` object.

Finally, we define a `render` method that will output HTML markup for a given data object :

```ts filename=pages/posts.ts lines=[5,14-20]
import { 
    DataResponse, 
    PathList, 
    StaticHandlerContext,
    RenderContext 
} from "frugal/page.ts"

...

export function generate({ path: { slug } }: StaticHandlerContext<typeof pattern>) {
    return new DataResponse<Data>({ data: POSTS.find(post => post.slug === slug) })
}

export function render({ data }: RenderContext<typeof pattern, Data> ) {
    return `<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

Now that our page is complete, we can add it to the `pages` list in the `frugal.config.ts` module :

```ts filename=frugal.config.ts lines=[5]
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts', 'pages/posts.ts']
} satisfies Config;
```

Here is the whole file `pages/posts.ts` after we are done :

```ts filename=pages/posts.ts
import { 
    DataResponse, 
    PathList, 
    StaticHandlerContext, 
    RenderContext 
} from "frugal/page.ts"

export const pattern = '/post/:slug'

type Data = { 
    slug:string; 
    title: string; 
    content: string;
}

const POSTS = [
    {
        slug: "hello-world",
        title: "Hello world",
        content: "<p>This is my first post ever</p>"
    },
    {
        slug: "second-post",
        title: "Second post",
        content: "<p>And a second post !</p>"
    },
]

export function getPaths(): PathList<typeof pattern> {
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function generate({ path: { slug } }: StaticHandlerContext<typeof pattern>) {
    return new DataResponse<Data>({ data: POSTS[slug] })
}

export function render({ data }: RenderContext<typeof pattern, Data> ) {
    return `<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

> [!info]
> The is the general shape of a static page: a `pattern` string and three methods `getPaths`, `generate`, and `render`.
>
> But as you saw earlier with the `pages/home.ts` page, `getPaths` and `generate` are optional if you don't need them :
>
> - You don't need `getPaths` for a page with a single path, .
> - You don't need `generate` for a page without any data fetching.
>
> However, you must always define a `pattern` and a `render` method.

## External data

Having the `POSTS` array keeps everything simple, but mixing code and data's not a good practice; we'd have to update the page code each time we want to add a post.

Instead, having a list of markdown files and a `toc.json` file containing any metadata (like the title) would be better. To add a post, we write a new markdown file and add it to the `toc.json` file.

To do so, we create a `post` directory where we write a `toc.json` file :

```ts filename=post/toc.json
[
    {
        slug: "hello-world",
        title: "Hello world",
        file: "hello-world.md"
    },
    {
        slug: "second-post",
        title: "Second post",
        file: "second-post.md"
    }
]
```

And we create the corresponding markdown files in the `post` directory.

Now we have to rewrite the `getPaths` and `generate` methods. Let's start with `getPaths`. We have to load the `toc.json` file and iterate over each post:

```ts filename=pages/posts.ts lines=[3,8,12-17]
import { 
    DataResponse, 
    GetPathsParams,
    PathList, 
    StaticHandlerContext, 
    RenderContext
} from "frugal/page.ts"
import * as path from "https://deno.land/std@{{DENO_STD_VERSION}}/path/mod.ts"

...

export async function getPaths({ resolve }: GetPathsParams): PathList<typeof pattern> {
    const tocText = await Deno.readTextFile(resolve('posts/toc.json'))
    const toc = JSON.parse(tocText)

    return toc.map(entry => ({ slug: entry.slug }));
}

...
```

> [!info]
> The call to the `resolve` method is necessary because Frugal will compile your project, output it in another place and run it from there. It means that relative paths might not be preserved. The `resolve` method will resolve paths relative to the root of your project.

For the `generate` method, given the slug, we find the corresponding entry in the `toc.json` file, read the referenced file, and compile the markdown :

```ts filename=pages/posts.ts lines=[2,10,14-27]
import { 
    DataResponse, 
    EmptyResponse,
    GetPathsParams,
    PathList, 
    StaticHandlerContext, 
    RenderContext
} from "frugal/page.ts"
import * as path from "https://deno.land/std@{{DENO_STD_VERSION}}/path/mod.ts"
import { marked } from "https://esm.sh/marked"

...

export function async generate({ path: { slug }, resolve }: StaticHandlerContext<typeof pattern>) {
    const tocText = await Deno.readTextFile(resolve('posts/toc.json'))
    const toc = JSON.parse(tocText)

    const entry = toc.find(entry => entry.slug === slug)

    if (entry === undefined) {
        return new EmptyResponse({ status: 404 })
    }

    const markdown = await Deno.readTextFile(resolve(`posts/${entry.file}`))
    const content = marked.parse(markdown)
    return new DataResponse<Data>({ data: { title: entry.title, content} })
}

...
```

> [!tip]
> Additionally to `DataResponse`, the `generate` function can return `EmptyResponse` when you wish to return a response without calling the `render` method. Here we use it to return a `404` without a body.

Here is the whole file `pages/posts.ts` after we are done :

```ts filename=pages/posts.ts
import { 
    DataResponse, 
    EmptyResponse,
    GetPathsParams,
    PathList, 
    StaticHandlerContext, 
    RenderContext
} from "frugal/page.ts"
import * as path from "https://deno.land/std@{{DENO_STD_VERSION}}/path/mod.ts"
import { marked } from "https://esm.sh/marked"

export const pattern = '/post/:slug'

type Data = { 
    slug:string; 
    title: string; 
    content: string;
}

const POSTS = [
    {
        slug: "hello-world",
        title: "Hello world",
        content: "<p>This is my first post ever</p>"
    },
    {
        slug: "second-post",
        title: "Second post",
        content: "<p>And a second post !</p>"
    },
]

export async function getPaths({ resolve }: GetPathsParams): PathList<typeof pattern> {
    const tocText = await Deno.readTextFile(resolve('posts/toc.json'))
    const toc = JSON.parse(tocText)

    return toc.map(entry => ({ slug: entry.slug }));
}

export function async generate({ path: { slug }, resolve }: StaticHandlerContext<typeof pattern>) {
    const tocText = await Deno.readTextFile(resolve('posts/toc.json'))
    const toc = JSON.parse(tocText)

    const entry = toc.find(entry => entry.slug === slug)

    if (entry === undefined) {
        return new EmptyResponse({ status: 404 })
    }

    const markdown = await Deno.readTextFile(resolve(`posts/${entry.file}`))

    const content = marked.parse(markdown)

    return new DataResponse<Data>({ data: { title: entry.title, content} })
}

export function render({ data }: RenderContext<typeof pattern, Data> ) {
    return `<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

We now have a small markdown file-based static blog, but it serves only raw HTML for now. In the next section, we will add assets (js scripts and CSS) to our pages.
