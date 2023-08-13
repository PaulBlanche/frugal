# Styles and scripts

## Adding style to our posts

Adding styles is simple: write the CSS and import it. Nothing says frugal like relying on the web platform, so Frugal makes it simple.

We can create a `pages/post.css` file at the root of the project :

```css filename=pages/post.css
h1 {
    color: green;
    font-size: 4rem;
}
```

And we import it into our page `pages/post.ts`, and link the generated stylesheet in our markup :

```ts filename=pages/post.ts lines=[3,7,9-11]
...

import "./post.css";

...

export function render({ data, assets, descriptor }: RenderContext<typeof route, Data> ) {
    return `<html>
    <head>
        <link rel="stylesheet" href="${assets["style"][descriptor]}" />
    </head>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

> [!info]
> The `assets` parameters contain all the pages' generated assets. They are first grouped by type (`"style"`, `"script"`, ...), then by "page". The `descriptor` parameter is the unique identifier of the current page.

If you visit the homepage, you'll see that the styles are not applied there. It's because Frugal creates a different CSS bundle for each page. Let's fix that by giving it its own style with a `pages/home.css` file :

```css filename=pages/home.css
h1 {
    color: blue;
    font-size: 4rem;
}
```

We also edit the `pages/home.ts` module to import the style and link the generated stylesheet in the markup :

```ts filename=page/home.ts lines=[1-2,6,8-10]
import { RenderContext } from "https://deno.land/std@{{DENO_STD_VERSION}}/page.ts"
import "./home.css";

export const route = '/'

export function render({ assets, descriptor }: RenderContext<typeof route>) {
    return `<html>
    <head>
        <link rel="stylesheet" href="${assets["style"][descriptor]}" />
    </head>
    <body>
        <h1>My blog</h1>
    </body>
</html>`
}
```

Now the title on the homepage is blue, while it is purple in the posts. Each page gets its own style.

## First client-side script

Let's add a super simple script to our homepage page. First, we have to configure Frugal to bundle _scripts_ :

```ts filename=frugal.config.ts lines=[7]
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import { script } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/script.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts', 'pages/posts.ts'],
    plugins: [script()],
} satisfies Config;
```

Each module ending with `.script.ts` will be interpreted as a client-side script and bundled with other scripts from the page. Let's write our first seizure-inducing script :

```ts filename=hello.script.ts
const TITLE_ID = 'blog-title'

if (import.meta.main) {
    const title = document.getElementById(TITLE_ID)!
    
    let color = 'blue';
    title.style.color = color

    setInterval(() => {
        title.style.color = color
        color = color === 'blue' ? 'red' : 'blue;
    }, 400)
}
```

> [!tip]
> The value `import.meta.main` will only be `true` when the module is loaded in the browser and `false` otherwise.
>
> This means that the inside of the condition won't run at build time; it will run only client-side. Any code outside the condition will be executed both at build time and client-side.

We can import it from our homepage `pages/home.ts`, and link to the generated script in the markup :

```ts filename=page/home.ts lines=[3,11,14]
import { RenderContext } from "https://deno.land/std@{{DENO_STD_VERSION}}/page.ts"
import "./post.css";
import { TITLE_ID } from  "hello.script.ts";

export const route = '/'

export function render({ assets, descriptor }: RenderContext<typeof route>) {
    return `<html>
    <head>
        <link rel="stylesheet" href="${assets["style"][descriptor]}" />
        <script type="module" src="${assets["script"][descriptor]}"></script>
    </head>
    <body>
        <h1 id="${TITLE_ID}">My blog</h1>
    </body>
</html>`
}
```

Here we also assigned the id exported by the script to the `h1` tag. That way, we only ever have to define "hooks" (like id or class) for our script in one place (a unique source of truth) to keep both the scripts and the markup in sync. Changing the exported id in the script will also update the markup.

> [!warn]
> Frugal only generates es modules. They need to be imported with `type="module"` to work, and won't work with [older browsers](https://caniuse.com/es6-module). It's by design, to force you to consider javascript as an _optional enhacement_ of a functional page and not _what_ makes the page functional.
>
> If you truly want your scripts to work on older browsers, you'll have to bundle them yourself.

If we load the homepage, we see that our script is executed. Scripts behave the same way as styles (a bundle is created for each page), so our post pages won't run the script we created.

In the next section, we will use preact server side and create our first island.
