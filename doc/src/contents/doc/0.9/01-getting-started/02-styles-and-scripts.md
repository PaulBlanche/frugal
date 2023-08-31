# Styles and scripts

## Adding style to our posts

Adding styles is simple: write the CSS and import it. Nothing says frugal like relying on the web platform, so Frugal makes it simple.

We can create a `pages/post.css` file:

```css filename=pages/post.css
h1 {
    color: green;
    text-decoration: solid underline;
    font-size: 4rem;
}
```

We then import it into our page `pages/post.ts`, and link the generated stylesheet in our markup:

```ts filename=pages/post.ts lines=[3,7,10-14]
...

import "./post.css";

...

export function render({ data, assets }: RenderContext<typeof route, Data> ) {
    return `<!DOCTYPE html>
<html>
    <head>
        ${assets.get("style").map(href => {
            return `<link rel="stylesheet" href="${href}" />`
        }).join('\n        ')}
    </head>
    <body>
        <h1>${data.title}</h1>
        ${data.content}
    </body>
</html>`
}
```

> [!info]
> The `assets` parameters contain the assets generated for the page. They are grouped by type (`"style"`, `"script"`, ...), and can contain multiple asset for each page. The value returned by `assets.get()` will depend on the type of assets. Here for the type `"style"` you get a list of stylesheet's url.

We imported and applied the style in the posts page. If you tried to insert stylesheets in the `<head>` of the homepage you'll see nothing. It's because Frugal creates a different CSS bundle for each page. For the posts page `assets.get()` returns one url containing `post.css`, but for the homepage since no `.css` file where imported, no stylesheet were generated and `assets.get()` returns an empty array. Let's fix that by giving it its own style with a `pages/home.css` file:

```css filename=pages/home.css
h1 {
    color: blue;
    text-decoration: wavy underline;
    font-size: 4rem;
}
```

We also edit the `pages/home.ts` module to import the style and link the generated stylesheet in the markup:

```ts filename=page/home.ts lines=[1-2,6,9-13]
import { RenderContext } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import "./home.css";

export const route = '/'

export function render({ assets }: RenderContext<typeof route>) {
    return `<!DOCTYPE html>
<html>
    <head>
        ${assets.get("style").map(href => {
            return `<link rel="stylesheet" href="${href}" />`
        }).join('\n        ')}
    </head>
    <body>
        <h1>My blog</h1>
    </body>
</html>`
}
```

Now the title on the homepage is blue with a wavy underline, while it is green with a solid underline in the posts. Each page gets its own style.

> [!info]
> If you have global styles you want applied to each pages of your project, you can set the [`globalCss`](/doc@{{version}}/reference/configuration#heading-globalcss) in your config. The compiled global stylesheet will be added to the array returned by `assets.get()` for each pages.

## First client-side script

Let's add a super simple script to our homepage page. First, we have to configure Frugal to bundle _scripts_:

```ts filename=frugal.config.ts lines=[7]
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import { script } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/script.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts', 'pages/posts.ts'],
    plugins: [script()],
} satisfies Config;
```

Each module ending with `.script.ts` will be interpreted as a client-side script and bundled with other scripts from the page. Let's write our first seizure-inducing script:

```ts filename=page/hello.script.ts
export const TITLE_ID = 'blog-title'

if (import.meta.environment === 'client') {
    const title = document.getElementById(TITLE_ID)!
    
    let color = 'blue';
    title.style.color = color

    setInterval(() => {
        title.style.color = color
        color = color === 'blue' ? 'red' : 'blue;
    }, 400)
}
```

> [!info]
> The value `import.meta.environment` will change depending on the execution environment. At build time or in the server the value will be `"server"`. Inside a browser it will be `"client"`.
>
> This means that the inside of the condition won't run at build time; it will run only client-side. Any code outside the condition will be executed both at build time and client-side.

We can import our script into our homepage `pages/home.ts`, and link to the generated script in the markup:

```ts filename=page/home.ts lines=[3,14-16,19]
import { RenderContext } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import "./post.css";
import { TITLE_ID } from  "./hello.script.ts";

export const route = '/'

export function render({ assets }: RenderContext<typeof route>) {
    return `<!DOCTYPE html>
<html>
    <head>
        ${assets.get("style").map(href => {
            return `<link rel="stylesheet" href="${href}" />`
        }).join('\n        ')}
        ${assets.get("script").map(src => {
            return `<script type="module" src="${src}"></script>`
        }).join('\n        ')}
    </head>
    <body>
        <h1 id="${TITLE_ID}">My blog</h1>
    </body>
</html>`
}
```

Here we also assigned the id exported by the script to the `h1` tag. That way, we only ever have to define "hooks" (like id or class) for our script in one place (a unique source of truth) to keep both the scripts and the markup in sync. Changing the exported id in the script will also update the markup.

> [!warn]
> Frugal only generates es modules from scripts. They need to be imported with `type="module"` to work, and won't work with [older browsers](https://caniuse.com/es6-module). It's by design, to encourage you to consider javascript as an _optional enhacement_ of a functional page and not _what_ makes the page functional.
>
> If you have critical scripts that must work on older browsers, you'll have to bundle them yourself.

If we load the homepage, we see that our script is executed. Scripts behave the same way as styles (a bundle is created for each page), so our post pages won't run the script we created.

In the next section, we will use preact server side and create our first island.
