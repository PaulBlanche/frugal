# Getting Started

## Create a page

In a module (`/pages/hello-world.ts` for example), create a [static page descriptor](/docs/page-descriptor/static-page) :

```tsx
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';

export const pattern = '/hello-world';

export function getStaticData() {
    return { data: 'Hello world' };
}

export function getContent({ data }: frugal.GetContentParams<any, string>) {
    return `<html>
        <body>
            <p>${data}</p>
        </body>
    </html>`;
}

export const self = new URL(import.meta.url);
```

## Add some style

In a module (`/pages/hello-world.style.ts` for example), define some styles using the `styled` module :

```tsx
import {
    className,
    createGlobalStyle,
} from 'https://deno.land/x/frugal/packages/loader_style/styled.ts';

export const body = className('body').styled`
    body {
        margin: 0;
    }
`;

export const paragraph = className('paragraph').styled`
    color: red;
    font-weight: bold;
`;
```

The `className` function will generate a unique classname based on the css properties and name (`'paragraph'`) given.

You can edit your page to use the styles you defined :

```tsx
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';
import { cx } from 'https://deno.land/x/frugal/packages/loader_style/styled.ts';

import * as style from './hello-world.style.ts';

//...

export function getContent(
    { data, loaderContext }: frugal.GetContentParams<any, string>,
) {
    const styleUrl = loaderContext.get('style');

    return `<html>
        <head>
            <link rel='stylesheet' href="${styleUrl}" />
        </head>
        <body class="${cx(style.body)}">
            <p class="${cx(style.paragraph)}">${data}</p>
        </body>
    </html>`;
}
```

## Configuration

Next, you need to configure frugal. Create a module `furgal.config.ts` (the name is not important, it's juste conventional) exporting a config object :

```ts
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';
import { StyleLoader } from 'https://deno.land/x/frugal/packages/loader_style/mod.ts';
import * as helloWorld from './pages/hello-world.ts';

const self = new URL(import.meta.url);

export const config: frugal.Config = {
    self,
    outputDir: './dist',
    pages: [
        frugal.page(helloWorld),
    ],
    loader: [
        new StyleLoader({
            test: (url) => /\.style\.ts$/.test(url.toString()),
        }),
    ],
    listen: {
        port: 8000,
    },
};
```

What's important is the `outputDir` wich will contain everything frugal generates. In this directory, frugal will create a `public` folder that contains everything that needs to be served.

> ℹ️ the `public` folder is ready to be served with a server like `nginx` or `Apache HTTP Server`.

The `pages` array contains all page descriptor of your website.

The `loader` array contains the [loaders](/docs/concepts/loader) you need to build your website. We are using the `style` loader and instructing it to work on modules that ends with `.style.ts`. This loader will build a css file from all modules matching this pattern. That way, we will build a css files containing the rules we defined in our style module earlier.

## Build and serve

Create a file `/build.ts` :

```ts
import { config } from './frugal.config.ts';
import { build } from 'https://deno.land/x/frugal/packages/core/mod.ts';

await build(config);
```

Running this file will build your project. You might need the following permissions :

- `allow-write`. Technically, frugal only needs to write file within your project (and specifically the `outputDir`), but for now `esbuild` for deno downloads a binary and store it somewhere in your computer (the path changes depending on the OS and other config). If you know where esbuild will write, you can restrict the `allow-write` to this path and the root of your project
- `allow-read`. Again, frugal only needs to read file within your project, but `esbuild` for deno need to read the path where it store its binary to know if it got the correct version. If you know where esbuild will read, you can restrict the `allow-read` to this path and the root of your project.
- `allow-net` for each dependency CDN. Frugal relies on `deno.land` and `esm.sh`.
- `allow-env`. Technically, frugal does not need access to any env variable, but `esbuild` will check some to know where to store its binary. If you know wich env variable `esbuild` will read, you can restrict `allow-env` to thoses.
- `allow-run`. Technically, frugal does not need to run anythin, but `esbuild` will run its binary. If you know where this binary will be stored, you can restrict `allow-run` to this binary.

Create a file `/serve.ts` :

```ts
import { config } from './frugal.config.ts';
import { serve } from 'https://deno.land/x/frugal/packages/frugal_server/mod.ts';

await serve(config);
```

Running this file will serve your project. You will need to run a build first, to create the frugal instance. The `serve.ts` script will only load this instance (faster boot than recreating the instance from scratch). You might need the following permissions :

- `allow-read` at least on the root of your project.
- `allow-write` on the root of your project. Strictly speaking, frugal will only write in the `outputDir` defined in the configuration.
- `allow-net` for each dependency CDN and for server ports. frugal relies on `deno.land` and `esm.sh` and `0.0.0.0:8000` or the hostname and port you choose to serve your project.

## Dev mode

Create a file `/dev.ts` :

```ts
import { config } from './frugal.config.ts';
import { watch } from 'https://deno.land/x/frugal/packages/frugal_server/mod.ts';

await watch(config);
```

Running this file will serve your project in dev mode. This means that frugal will build and serve your projet in one go, watching the source of your project and rebuild/restarting the server each time a file changes. Each time the server restarts, the page in the browser is refreshed. You might need the following permissions :

- all permission for `build` and `serve`
- `allow-net` for `0.0.0.0:4075` for the livereload server
