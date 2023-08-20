# Blog posts

For our blog, we need to have a "blog post page" that displays a given blog post. We want this page to be static and generated for each of our posts.

## Static page with data fetching

Before anything, we need a list of posts to render. As a starting we will use an array of posts, and to simplify things further we will write this array directly in our page file `pages/posts.ts`.

```ts filename=pages/posts.ts
type Post = { 
    slug: string; 
    title: string; 
    content: string;
}

const POSTS: Post[] = [
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

Now we need to define the pattern of URLs generated from the page. We would like URLs like `/post/hello-world` and `/post/second-post` for our posts. To do so, we will use the route `/post/:slug` :

```ts filename=pages/posts.ts lines=[7]
...

const POSTS: Post[] = [
    ...
]

export const route = '/post/:slug';
```

To generate an html page for each post, Frugal needs you to define a `getPaths` method (called at build time) that will return the list of all possible "path objects". With a route `/post/:slug`, the path object will have the shape `{ slug: string }`. The `getPaths` method has to return the list of each slug:

```ts filename=pages/posts.ts lines=[1,7-9]
import { PathList } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

...

export const route = '/post/:slug';

export function getPaths(): PathList<typeof route> {
    return POSTS.map((post) => ({ slug: post.slug }))
}
```

> [!tip]
> The `PathList` type will infer the shape of the path objects from the `route` for you. That's why you need the `PathList<typeof route>` type.

We simply have to map over an array, but any asynchronous operations can happen here: reading from a file or a database, calling an API, etc...

Then, we define the data fetching method `generate`. This method is called at build time, and this is where - given the URL parameters - we query any data needed to build the page :

```ts filename=pages/posts.ts lines=[2,4,13-15]
import { 
    DataResponse, 
    PathList, 
    StaticHandlerContext 
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

...

export function getPaths(): PathList<typeof route> {
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function generate({ path: { slug } }: StaticHandlerContext<typeof route>) {
    return new DataResponse<Post>(POSTS.find(post => post.slug === slug))
}
```

Here we search an array, but again any asynchronous operations can happen here.

The consolidated data that was fetched (here a single `Post` matching the given slug) is returned in a `DataResponse` object.

Finally, we define a `render` method that will output HTML markup for a given data object :

```ts filename=pages/posts.ts lines=[5,14-22]
import { 
    DataResponse, 
    PathList, 
    StaticHandlerContext,
    RenderContext 
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

...

export function generate({ path: { slug } }: StaticHandlerContext<typeof route>) {
    return new DataResponse<Post>(POSTS.find(post => post.slug === slug))
}

export function render({ data }: RenderContext<typeof route, Post> ) {
    return `<!DOCTYPE html>
<html>
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
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export const route = '/post/:slug'

type Post = { 
    slug:string; 
    title: string; 
    content: string;
}

const POSTS: Post[] = [
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

export function getPaths(): PathList<typeof route> {
    return POSTS.map((post) => ({ slug: post.slug }))
}

export function generate({ path: { slug } }: StaticHandlerContext<typeof route>) {
    return new DataResponse<Post>(POSTS.find(post => post.slug === slug))
}

export function render({ data }: RenderContext<typeof route, Post> ) {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

> [!info]
> The is the general shape of a static page: a `route` string and three methods `getPaths`, `generate`, and `render`.
>
> But as you saw earlier with the `pages/home.ts` page, `getPaths` and `generate` are optional if you don't need them :
>
> - You don't need `getPaths` for a page with a single path, .
> - You don't need `generate` for a page without any data fetching.
>
> However, you must always define a `route` and a `render` method.

## External data

Having the `POSTS` array keeps everything simple, but mixing code and data's not a good practice; we'd have to update the page code each time we want to add a post.

Instead, we could have an `posts.json` file containing all our posts. Adding a post would simply means adding a new entry to the `posts.json`. No code modification needed.

To do so, we create a `pages/posts.json` file :

```ts filename=pages/posts.json
[
    {
        "slug": "hello-world",
        "title": "Hello world",
        "content": "<p>This is my first post ever</p>"
    },
    {
        "slug": "second-post",
        "title": "Second post",
        "content": "<p>And a second post !</p>"
    }
]
```

We can remove our `POSTS` array. Instead of reading from the array, we will read from the `posts.json` file.

Now we have to rewrite the `getPaths` and `generate` methods. Let's start with `getPaths`. We have to load the `posts.json` file and iterate over each post:

```ts filename=pages/posts.ts lines=[3,11-17]
import { 
    DataResponse, 
    GetPathsParams,
    PathList, 
    StaticHandlerContext, 
    RenderContext
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

...

export async function getPaths({ resolve }: GetPathsParams): Promise<PathList<typeof route>> {
    const postsAbsolutePath = resolve('pages/posts.json')
    const postsText = await Deno.readTextFile(postsAbsolutePath)
    const posts: Post[] = JSON.parse(postsText)

    return posts.map(post => ({ slug: post.slug }));
}

...
```

> [!info]
> The call to the `resolve` method is necessary because Frugal will compile your project, output it in another place and run it from there. It means that relative paths might not be preserved. The `resolve` method will resolve paths relative to the root of your project.

For the `generate` method, given the slug, we find the corresponding entry in the `posts.json` file and get its `"content"`. :

```ts filename=pages/posts.ts lines=[2-3,12-24]
import { 
    DataResponse, 
    EmptyResponse,
    GetPathsParams,
    PathList, 
    StaticHandlerContext, 
    RenderContext
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

...

export async function generate({ path: { slug }, resolve }: StaticHandlerContext<typeof route>) {
    const postsAbsolutePath = resolve('pages/posts.json')
    const postsText = await Deno.readTextFile(postsAbsolutePath)
    const posts: Post[] = JSON.parse(postsText)

    const post = posts.find(post => post.slug === slug)

    if (post === undefined) {
        return new EmptyResponse({ status: 404 })
    }

    return new DataResponse<Post>(post)
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
} from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export const route = '/post/:slug'

type Post = { 
    slug:string; 
    title: string; 
    content: string;
}


export async function getPaths({ resolve }: GetPathsParams): Promise<PathList<typeof route>> {
    const postsAbsolutePath = resolve('pages/posts.json')
    const postsText = await Deno.readTextFile(postsAbsolutePath)
    const posts: Post[] = JSON.parse(postsText)

    return posts.map(post => ({ slug: post.slug }));
}

export async function generate({ path: { slug }, resolve }: StaticHandlerContext<typeof route>) {
    const postsAbsolutePath = resolve('pages/posts.json')
    const postsText = await Deno.readTextFile(postsAbsolutePath)
    const posts: Post[] = JSON.parse(postsText)

    const post = posts.find(post => post.slug === slug)

    if (post === undefined) {
        return new EmptyResponse({ status: 404 })
    }

    return new DataResponse<Post>(post)
}

export function render({ data }: RenderContext<typeof route, Post> ) {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

## Using markdown

Having raw html inside json in our `pages/posts.json` file is not practical. Instead of having a `"content"` value, we could have a `"file"` value, giving a path to a markdown file. It would make editing content easier.

To do so, we write two markdown files with our content (`/pages/hello-world.md` and `/pages/second-post.md`) and update the `pages/posts.json` file :

```ts filename=pages/posts.json
[
    {
        "slug": "hello-world",
        "title": "Hello world",
        "file": "pages/hello-world.md"
    },
    {
        "slug": "second-post",
        "title": "Second post",
        "file": "pages/second-post.md"
    }
]
```

Previously, `pages/posts.json` contained a list of `Post` (`title`, `slug` and `content`). Now it contains a different type (`title`, `slug` and `file`) that we'll call `Entry` :

```ts filename=pages/posts.ts
...

type Entry = {
    slug: string,
    title: string,
    file: string
}
```

The `getPaths` method does not change (excepte for a change in type to use `Entry`), since the `pages/posts.json` still contains all slug that needs to be generated. But we need to change the `generate` method to read and compile the markdown file :

```ts filename=pages/posts.ts lines=[3,10,27-30]
...

import { marked } from "https://esm.sh/marked"

...

export async function getPaths({ resolve }: GetPathsParams): Promise<PathList<typeof route>> {
    const postsAbsolutePath = resolve('pages/posts.json')
    const postsText = await Deno.readTextFile(postsAbsolutePath)
    const posts: Entry[] = JSON.parse(postsText)

    return posts.map(post => ({ slug: post.slug }));
}


export async function generate({ path: { slug }, resolve }: StaticHandlerContext<typeof route>) {
    const postsAbsolutePath = resolve('pages/posts.json')
    const postsText = await Deno.readTextFile(postsAbsolutePath)
    const posts: Entry[] = JSON.parse(postsText)

    const post = posts.find(post => post.slug === slug)

    if (post === undefined) {
        return new EmptyResponse({ status: 404 })
    }

    const markdown = await Deno.readTextFile(resolve(entry.file))
    const content = marked.parse(markdown)
        
    return new DataResponse<Post>({ slug:post.slug, title: post.title, content })
}
```

We now have a small markdown file-based static blog, but it could be improved :

- the `pages/` directory is a mess of unrelated files (`.ts` files for pages, `.json` and `.md` for data). We could better organise the project by separating data and source files.
- instead of having the `posts.json` file, we could have all our markdown files in a single directory, each with a front-matter for title and slug. The `getPaths` method would scan the directory, parse the front-matter of each file and output the liste of slugs

Our static blog only serves raw HTML for now. In the next section, we will add assets (js scripts and CSS) to our pages.
