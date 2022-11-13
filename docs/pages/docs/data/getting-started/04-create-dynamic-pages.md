# Create a dynamic page

## Frugal configuration

If we want to add a dynamic page, we need to configure Frugal to use the server:

```ts
import { Config } from 'https://deno.land/x/frugal/server.ts';

const self = new URL(import.meta.url);

export const config: Config = {
    //...
    server: {
        listen: {
            port: 8000,
        },
    },
};
```

With this configuration you will get a server on port `8000` that will be able to serve generated static pages (with some extra capabilities we will see later) and dynamic pages.

## Dynamic page descriptor

In a module (`/pages/posts/list.ts` for example), create a [dynamic page descriptor](/docs/api/01-page-descriptor):

```tsx
import type * as frugal from 'https://deno.land/x/frugal/core.ts';
import { queryPostList } from './api.ts';
import { postCard } from './component/postCard.ts';

export const pattern = '/posts';

export async function getDynamicData(
    request: Request,
    context: GetStaticDataContext,
): Promise<DataResult<Post[]>> {
    const searchParams = new URL(request.url).searchParams;
    const postList = await queryPostList(searchParams.get('page'));
    return { data: postList };
}

export function getContent(params: frugal.GetContentParams<Path, Post>) {
    return `<html>
        <body>
            ${
        params.data.map((post) => {
            return postCard(post);
        })
    }
        </body>
    </html>`;
}

export const self = new URL(import.meta.url);
```

What changes compared to a static page:

- no `getPathList` function
- the `getStaticData` function is replaced with a `getDynamicData` function. Its role is the same as the `getStaticData` function, returning a data object for the view given the incoming request. Everything you need from a distant source (database, file, api) to generate your page, you should fetch here. This function can be async

Again, like for static pages we have to register it in `/frugal.config.ts`:

```ts
//...
import * as postList from './pages/posts/list.ts';

export const config: frugal.Config = {
    //...
    pages: [
        //...
        frugal.page(postList),
    ],
};
```

## Signed cookies and crypto keys

The server will need to generate signed cookies, and needs a crypto key to do so. Keys can be generated with the following script :

```ts
import { exportKey } from 'https://deno.land/x/frugal/server.ts';

console.log(await exportKey());
```

You should get a base64 value of the secret crypto key. You can now add it to your configuration :

```ts
export const config: frugal.Config = {
    //...
    pages: [
        //...
        frugal.page(postList),
    ],

    server: {
        session: {
            key: await importKey(MY_SECRET_CRYPTO_KEY),
        },
    },
};
```

[warn]> **Never commit the secret key in your repo**. Always use environment variables to pass the secret key to your code.
[warn]>
[warn]> If an attacker has access to this key, he could forge any signed cookie Frugal generates and bypass security measures (like CSRF mitigation).

## Serve the website

With dynamic pages, Frugal will function as a web server. You will still need a build step so keep the `/build.ts` module. In a module `/serve.ts` add the following code:

```ts
import { config } from './frugal.config.ts';
import { serve } from 'https://deno.land/x/frugal/server.ts';

await serve(config);
```

Running the `build.ts` module will generate all static pages and assets (scripts and styles generated from the loaders). Then running the `serve.ts` module will start the server on the port you configured.

For dynamic pages, Frugal will do no incremental generation. Any time the page is requested, Frugal will generate it event if the underlying data or code did not change.

## Watch mode

In a module `/watch.ts` add the following code:

```ts
import { config } from './frugal.config.ts';
import { serve } from 'https://deno.land/x/frugal/server.ts';

await watch(config, [/* extra path to watch*/]);
```

Running the `watch.ts` module will do multiple things:

- All pages will be run as dynamic pages. Each request will trigger a full generation of the page.
- Each time a file imported in some of your page change, Frugal will rebuild all assets (styles and scripts) and reload the page on the client. If you want to watch extra path, you can pass them to the `watch` function.
