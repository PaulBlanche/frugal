# Styles and scripts

## Adding style to our posts

Adding styles is simple : write the css and import it. Nothing says frugal like relying on the web platform, so Frugal makes it simple for you.

We can create a `pages/post.css` file at the root of the project :

```css filename=pages/post.css
h1 {
    color: green;
    font-size: 4rem;
}
```

And we import it in our page `pages/post.ts`, and link the generated stylesheet in our markup :

```ts filename=pages/post.ts lines=[3,7,9-11]
...

import "./post.css";

...

export function render({ data, assets, descriptor }: RenderContext<typeof pattern, Data> ) {
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
> The `assets` parameters contains all the assets generated for all the pages. They are first grouped by type (`"style"`, `"script"`, ...) then by "page". The `descriptor` parameter is the unique identifier of the current page.

If you vist the homepage, you'll see that the styles are not applied there. It's because Frugal create a different css bundle for each page. Let's fix that by giving it it's own style with a `pages/home.css` file :

```css filename=pages/home.css
h1 {
    color: blue;
    font-size: 4rem;
}
```

We also edit the `pages/home.ts` module to import the style and link the generated stylesheet in the markup :

```ts filename=page/home.ts lines=[1-2,6,8-10]
import { RenderContext } from "frugal/page.ts"
import "./post.css";

export const pattern = '/'

export function render({ assets, descriptor }: RenderContext<typeof pattern>) {
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

Now the title on the homepage is blue while in the posts it is purple. Each page get its own style.

## First client-side script

Let's add a super simple script to our posts in the file. First we have to configure Frugal to bundle _scripts_ :

```ts filename=frugal.config.ts lines=[7]
import { Config } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import { script } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/plugins/script.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts', 'pages/posts.ts'],
    plugins: [script()],
} satisfies Config;
```

Now, each module ending with `.script.ts` will be interpreted as a client-side script, and bundled with other scripts from the page. Let's write our first script :

```ts filename=hello.script.ts
if (import.meta.main) {
    console.log('hello')
}
```

> [!tip]
> The value `import.meta.main` will only be `true` when the module is loaded in the browser, and `false` otherwise. This means that our script won't run when we import it later.

We can import it from our homepage `pages/home.ts`, and link to the generated script in the markup :

```ts filename=page/home.ts lines=[3,11]
import { RenderContext } from "frugal/page.ts"
import "./post.css";
import "hello.script.ts";

export const pattern = '/'

export function render({ assets, descriptor }: RenderContext<typeof pattern>) {
    return `<html>
    <head>
        <link rel="stylesheet" href="${assets["style"][descriptor]}" />
        <script type="module" src="${assets["script"][descriptor]}"></script>
    </head>
    <body>
        <h1>My blog</h1>
    </body>
</html>`
}
```

> [!warn]
> Frugal only generates es modules. They need to be imported with `type="module"` to work, and won't work with [older browsers](https://caniuse.com/es6-module).
>
> If you want your scripts to work on older browsers, you'll have to bundle them yourself.

Now if we load the homepage, we see in the developper console that `hello` was printed. And scripts behave the same way as styles : a bundle is created for each page, so our post pages wont run the script we created.

In the next section we will use preact server side, and create our first island.
