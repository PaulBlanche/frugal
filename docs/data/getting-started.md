# Getting Started

## Create a page

In a module (`/pages/hello-world.ts` for example), create a [static page descriptor](/docs/page-descriptor/static-page) :

```tsx
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';

export function getRequestList() {
    return [{}];
}

export const pattern = '/hello-world';

export function getStaticData(
    { request }: frugal.GetStaticDataParams<any>,
): Data {
    return 'Hello world';
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
    createGlobalStyle,
    styled,
} from 'https://deno.land/x/frugal/packages/loader_style/styled.ts';

createGlobalStyle`
    body {
        margin: 0;
    }
`;

export const paragraph = styled('paragraph')`
    color: red;
    font-weight: bold;
`;
```

The `styled` function will generate a unique classname based on the css properties and name (`'paragraph'`) given.

The `createGlobalStyle` function is used to define global styles. This is usefull to apply styles to elements you don't have access to (like `body` or `html`).

You can edit your page to use the styles you defined :

```tsx
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';
import * as s from './hello-world.style.ts';
import { cx } from 'https://deno.land/x/frugal/packages/loader_style/styled.ts';

//...

export function getContent(
    { data, loaderContext }: frugal.GetContentParams<any, string>,
) {
    const styleUrl = loaderContext.get('style');

    return `<html>
        <head>
            <link rel='stylesheet' href="${styleUrl}" />
        </head>
        <body>
            <p class="${cx(s.paragraph)}">${data}</p>
        </body>
    </html>`;
}
```

## Configuration

Next, you need to configure frugal. Create a module `furgal.config.ts` exporting a config object :

```ts
import { Config, page } from '../packages/core/mod.ts';
import * as helloWorld from './pages/hello-world.ts';
import { style } from 'https://deno.land/x/frugal/packages/loader_style/mod.ts';

const self = new URL(import.meta.url);

export const config: Config = {
    self,
    outputDir: './dist',
    pages: [
        page(helloWorld),
    ],
    loader: [style({
        test: (url) => /\.style\.ts$/.test(url.toString()),
    })],
};
```

What's important is the `outputDir` wich will contain everything frugal generates. In this directory, frugal will create a `public` folder that contains everything that needs to be served.

> ℹ️ the `public` folder is ready to be served with a server like `nginx` or `Apache HTTP Server`.

The `pages` array contains all page descriptor of your website.

The `loader` array contains the [loaders](/docs/concepts/loader) you need to build your website. We are using the `style` loader, and instructing it to work on modules that ends with `.style.ts`. This loader will build a css file from all modules matching this pattern.

## Build and serve

Create a file `/build.ts` :

```ts
import { config } from './frugal.config.ts';
import { Frugal } from '../core/mod.ts';

const frugal = await Frugal.build(config);
await frugal.build();
```

Running this file will build your project. You might need the following permissions :

- `allow-read`. Technically, frugal only needs to read file within your project, but for now `esbuild` for deno downloads a binary and store it somewhere in your computer (the path changes depending on the OS and other config). If you know where esbuild will write, you can restrict the `allow-read` to this path and the root of your project.
- `allow-write`. Again, frugal only needs to write file within your project (and specifically the `outputDir`), but `esbuild` needs to store the binary somewhere in your computer. If you know where esbuild will write, you can restrict the `allow-write` to this path and the root of your project
- `allow-net` for each dependency CDN. Frugal relies on `deno.land` and `esm.sh`.
- `allow-env`. Technically, frugal does not need access to any env variable, but `esbuild` will check some to know where to store its binary. If you know wich env variable `esbuild` will read, you can restrict `allow-env` to thoses.
- `allow-run`. Technically, frugal does not need to run anythin, but `esbuild` will run its binary. If you know where this binary will be stored, you can restrict `allow-run` to this binary.

Create a file `/serve.ts` :

```ts
import { config } from './frugal.config.ts';
import { Frugal } from '../core/mod.ts';
import { frugalMiddleware } from '../frugal_oak/mod.ts';

const frugal = await Frugal.load(config);

const application = new Application();

application.use(frugalMiddleware(frugal));

await application.listen({ port: 8000 });
```

Running this file will serve your project. Is your project contains static pages, you will have to run a build first. You might need the following permissions :

- `allow-read` at least on the root of your project.
- `allow-write` on the root of your project. Strictly speaking, frugal will only write in the `outputDir` defined in the configuration.
- `allow-net` for each dependency CDN (`deno.land` and `esm.sh` for frugal), and `0.0.0.0:8000` or the hostname and port you choose to serve your project.
