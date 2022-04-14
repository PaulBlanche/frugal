# Getting Started

## Create a page

In a module (`/pages/hello-world.ts` for example), create a [static page descriptor](/docs/concepts/static-page) :

```tsx
import type * as frugal from 'https://deno.land/x/frugal';

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

## Configuration

Next, you need to configure frugal. Create a module `furgal.config.ts` exporting a config object :

```ts
import { Config, page } from '../packages/core/mod.ts';
import * as helloWorld from './pages/hello-world.ts';

const self = new URL(import.meta.url);

export const config: Config = {
    self,
    outputDir: './dist',
    pages: [
        page(helloWorld),
    ],
};
```

## Build and serve

Create a file `/build.ts` :

```ts
import { config } from './frugal.config.ts';
import { Frugal } from '../core/mod.ts';

const frugal = await Frugal.build(config);
await frugal.build();
```

Running this file will build your project. You might need the following permissions :

- `allow-read` at least on the root of your project. If your pages need to read file outside your project, you'll need permission there too.
- `allow-write` on the root of your project. Strictly speaking, frugal will only write in the `outputDir` defined in the configuration.
- `allow-net` for each dependency CDN
- `allow-env` for some env variables (for now : `NODE_ENV`, `DENO_DIR`,`FRUGAL_REFRESH_KEY`)

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

- `allow-read` at least on the root of your project. If your pages need to read file outside your project, you'll need permission there too.
- `allow-write` on the root of your project. Strictly speaking, frugal will only write in the `outputDir` defined in the configuration.
- `allow-net` for each dependency CDN, and `0.0.0.0:8000` or the hostname and port you choose to serve your project.
- `allow-env` for some env variables (for now : `NODE_ENV`, `DENO_DIR`,`FRUGAL_REFRESH_KEY`)
