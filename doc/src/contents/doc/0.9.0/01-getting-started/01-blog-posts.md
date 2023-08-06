# Blog posts

For our blog, we need to have a "blog post page", a page that display a given blog post. We want this page to be generated for each of our posts

## Static page with "data fetching"

As with our first page, we will create a file `pages/posts.ts`. To display posts, first we need some data. As a starting point we will use an array :

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

Now we need to define the pattern of urls generated from the page. For our posts we would like urls like `/post/hello-world` and `/post/second-post`. To do so we will use the pattern `/post/:slug` :

```ts filename=pages/posts.ts lines=[7]
...

const POSTS: Data[] = [
    ...
]

export const pattern = '/post/:slug';
```

In order to generate an html page for each post, Frugal needs you to define a `getPaths` method that will return the list of all possible "path objects" : with a pattern `/post/:slug`, the path object will have the shape `{ slug: string }`. The `getPaths` method needs to return the list of each slugs :

```ts filename=pages/posts.ts lines=[1,7-9]
import { PathList } from "frugal/page.ts"

...

export const pattern = '/post/:slug';

export function getPaths(): PathList<typeof pattern> {
    return POSTS.map((post) => ({ slug: post.slug }))
}
```

> [!tip]
> The `PathList` type will infer the shape of the path objects from the `pattern` for you. That's why you need the strange `PathList<typeof pattern>`

Here we simply have to map over an array, but any asynchronous operations can happen here: reading from a file or a database, calling an API, etc...

Then, we define the data fetching method `generate`. This is where, given the url parameters, we query any data needed to build the page :

```ts filename=pages/posts.ts lines=[2,4,13-15]
import { 
    DataResponse, 
    PathList, 
    StaticHandlerContext 
} from "frugal/page.ts"

...

export function getPaths(): PathList<typeof pattern> {
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function generate({ path: { slug } }: StaticHandlerContext<typeof pattern>) {
    return new DataResponse<Data>({ data: POSTS.find(post => post.slug === slug) })
}
```

Here we simply search an array, but again any asynchronous operations can happen here (filesystem or database read, API call, etc...).

The consolidated data that was fetched is returned in a `DataResponse` object (that can also be used to set headers or response status).

Finally we define a `render` method that will output html markup for a given data object :

```ts filename=pages/posts.ts lines=[5,14-20]
import { 
    DataResponse, 
    PathList, 
    StaticHandlerContext,
    RenderContext 
} from "frugal/page.ts"

...

export function generate({ path: { slug } }: StaticHandlerContext<typeof pattern>) {
    return new DataResponse<Data>({ data: POSTS.find(post => post.slug === slug) })
}

export function render({ data }: RenderContext<typeof pattern, Data> ) {
    return `<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

Now that our page is complete, we can add it to the list in the `frugal.config.ts` module :

```ts filename=frugal.config.ts lines=[5]
import { Config } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

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
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function generate({ path: { slug } }: StaticHandlerContext<typeof pattern>) {
    return new DataResponse<Data>({ data: POSTS[slug] })
}

export function render({ data }: RenderContext<typeof pattern, Data> ) {
    return `<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

> [!info]
> The is the general shape of a static page : a `pattern` string, and three methods `getPaths`, `generate` and `render`.
>
> But as you saw earlier with the `pages/home.ts` page, `getPaths` and `generate` are optionnal if you don't need them :
>
> - for a page with a single path you don't need `getPaths`.
> - for a page without any data fetching you don't need `generate`.
>
> However you always have to define a `pattern` and a `render` method.

## External data

Having the `POST` array keeps everything simple, but it's not a good practice to mix code and data : we'd have to update the code of the page each time we want to add a post.

Instead, it would be simpler to have a list of markdown files and a `toc.json` file containing any metadata (like the title). That way to add a post, we simply write a new markdown file and add it to the `toc.json` file.

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

Now we have to rewrite the `getPaths` and `generate` methods. Let's start with `getPaths`. We have to load the `toc.json` file and iterate over each posts :

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
> The call to the `resolve` method is necessary because Frugal will compile your project, output it in some other place and run it from there. This means that relative paths might not be preserved.

For the `generate` method, given the slug, we find the corresponding entry in the `toc.json` file, read the referenced file and compile the markdown :

```ts filename=pages/posts.ts lines=[2,10,14-29]
import { 
    DataResponse, 
    EmptyResponse,
    GetPathsParams,
    PathList, 
    StaticHandlerContext, 
    RenderContext
} from "frugal/page.ts"
import * as path from "https://deno.land/std@{{DENO_STD_VERSION}}/path/mod.ts"
import { marked } from "npm:marked"

...

export function async generate({ path: { slug }, resolve }: StaticHandlerContext<typeof pattern>) {
    const tocText = await Deno.readTextFile(resolve('posts/toc.json'))
    const toc = JSON.parse(tocText)

    const entry = toc.find(entry => entry.slug === slug)

    if (entry === undefined) {
        return new EmptyResponse({ status: 404 })
    }

    const markdown = await Deno.readTextFile(resolve(`posts/${entry.file}`))

    const content = marked.parse(markdown)

    return new DataResponse<Data>({ data: { title: entry.title, content} })
}

...
```

> [!tip]
> Additionnaly to `DataResponse`, the `generate` function can return `EmptyResponse` when you wish to return a response without calling the `render` method. Here we use it to return a `404` without any body.

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
import { marked } from "npm:marked"

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

export function async generate({ path: { slug }, resolve }: StaticHandlerContext<typeof pattern>) {
    const tocText = await Deno.readTextFile(resolve('posts/toc.json'))
    const toc = JSON.parse(tocText)

    const entry = toc.find(entry => entry.slug === slug)

    if (entry === undefined) {
        return new EmptyResponse({ status: 404 })
    }

    const markdown = await Deno.readTextFile(resolve(`posts/${entry.file}`))

    const content = marked.parse(markdown)

    return new DataResponse<Data>({ data: { title: entry.title, content} })
}

export function render({ data }: RenderContext<typeof pattern, Data> ) {
    return `<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

We now have a small markdown file based static blog, but for now it serves only raw html. In the next section, we will add assets (js scripts and css) to our pages.
