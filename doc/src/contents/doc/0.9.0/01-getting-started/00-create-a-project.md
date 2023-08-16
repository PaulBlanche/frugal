# Create a project

## The configuration module `frugal.config.ts`

Frugal tries to assume as little as possible about your project, so you have to configure it. First, let's write the minimal configuration needed :

```ts filename=frugal.config.ts
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    self: import.meta.url,
    pages: []
} satisfies Config;
```

The `self` property should be the absolute path of the configuration module (obtained with [`import.meta.url`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta)). The folder where the config module resides will be the root of your project (the _dirname_ of `self`). Frugal will resolve every path relative to this root.

> [!warn]
> Unless you know what you are doing, `self` should always be `import.meta.url`.

The `pages` should list the paths of the page modules of your website.
It is empty for now, but not for long.

## Your first page

Create a file `pages/home.ts` with the following code :

```ts filename=pages/home.ts
export const route = '/'

export function render() {
    return `<!DOCTYPE html>
<html>
    <body>
        <h1>My blog</h1>
    </body>
</html>`
}
```

You just wrote your first static page with Frugal!

For now, we will not use any UI framework, so we output basic HTML with template strings in the `render` method. This method will be called at build time to generate the page's markup. The `route` contains the URL pattern of the generated page. Here the generated page will live at the root of the website.

Add the relative path to the newly created page in the configuration module :

```ts filename=frugal.config.ts lines=[5]
import { Config } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts']
} satisfies Config;
```

Now we need a script to _run_ Frugal.

## The dev script

Create a file `dev.ts` with the following code:

```ts filename=dev.ts
import { context } from "https://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import config from "./frugal.config.ts"

await context(config).watch()
```

Simply calling the `watch` function on the `context` will set up a watch process and a dev server with live-reload.

> [!tip]
> This script is the ideal place to load a [.dotenv file](@@@).

You can now run this script to get a dev server with live reload :

```console no-line-numbers
deno run -A dev.ts
```

Visiting [http://0.0.0.0:3000/](http://0.0.0.0:3000/) should display your page.

> [!info]
> The dev server has live-reload capacity. Changing the code of a page or any of its dependencies should trigger a page reload.
>
> However, this is limited to _staticaly analyzable imports_ (static imports or dynamic imports with paths known ahead of time). Any change in external data sources (database, API, filesystem ...) won't trigger a reload: you'll have to refresh the page manually

Now that we have a working project, we will start coding our blog in the next section.
