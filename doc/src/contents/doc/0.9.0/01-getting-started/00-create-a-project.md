# Create a project

## The configuration module `frugal.config.ts`

Frugal tries to assume as little as possible about your project, so you have to configure it. First lets write the minimal configuration needed :

```ts filename=frugal.config.ts
import { Config } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    self: import.meta.url,
    pages: []
} satisfies Config;
```

The `self` property should be the absolute path of the configuration module. The folder where the config module resides will be the root of your project. Frugal will resolve every path relatively to this path.

> [!warn]
> Unless you know what you are doing, `self` should always be `import.meta.url`.

The `pages` should list the paths to the page modules for your website. For now it is empty, but not for long.

## Your first page

Create a file `pages/home.ts` with the following code :

```ts filename=page/home.ts
export const pattern = '/'

export function render() {
    return `<html>
    <body>
        <h1>My blog</h1>
    </body>
</html>`
}
```

For now we will not be using any UI framework, so we simply output basic html.

Add the path (relative, since it will be resolved relatively to the config path in `self`) to the newly created page in the configuration module :

```ts filename=frugal.config.ts lines=[3]
import { Config } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"

export default {
    self: import.meta.url,
    pages: ['pages/home.ts']
} satisfies Config;
```

## The dev script

Create a file `dev.ts` with the following code:

```ts filename=dev.ts
import { context } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
import config from "./frugal.config.ts"

await context(config).watch()
```

Simply calling the `watch` function on the `context` will setup a watch process and a dev server with livereload.

> [!tip]
> This script is the ideal place to load a [.dotenv file](https://deno.land/manual@v1.35.3/basics/env_variables#env--file). You'd only need to _dynamically load_ your config file _after_ the `.dotenv` file :
>
> ```ts filename=dev.ts
> import { context } from "http://deno.land/x/frugal@{{FRUGAL_VERSION}}/mod.ts"
>
> // load your .dotenv file here
>
> const { default: config } =  await import("./frugal.config.ts")
> await context(config).watch()
> ```

You can now run this script to get a dev server with live reload :

```console no-line-numbers
deno run -A watch.ts
```

Visiting [http://0.0.0.0:8000/](http://0.0.0.0:8000/) should display your page.

> [!info]
> The dev server has livereload capacity. Changing the code of a page or any of its dependencies should trigger a page reload.
>
> However this is limited to staticaly analysable imports (static imports or dynamic imports with static paths). Any data change in a file or a database that is read won't trigger a page reload : you'll have to manually refresh the page

Now that we have a working project, we will start coding our blog in the next section.
