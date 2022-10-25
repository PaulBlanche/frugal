# Server

Frugal is only a rendering orchestrator. By itself, furgal is only able to build a static website.

But with `frugal_server` you can have a server that uses frugal in order to :

- render server-side dynamic pages on demand
- refresh server-side static pages on demand
- handle POST, PUT, PATCH and DELETE request with a POST-redirect-GET pattern

## Setup a server

Create a file `/serve.ts` :

```ts
import { serve } from 'https://deno.land/x/frugal/packages/frugal_server/mod.ts';
import { config } from './frugal.config.ts';

await serve(config);
```

## Features

### Header control

For both static and dynamic pages, you can define return some headers alongside the data in `getDynamicData` and `getStaticData` :

```ts
//...

export function getStaticData(
    { path }: frugal.GetStaticDataContetx<Path>,
): frugal.DataResult<Data> {
    return {
        data: {
            //...
        },
        headers: {
            'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
    };
}
```

### POST, PUT, PATCH and DELETE handling

both static and dynamic pages, you can define a [`handlers` object](/docs/concepts/page-descriptor/handlers) describing how this page should react to `POST`, `PUT`, `PATCH` and `DELETE`.

For page descriptor (static or dynamic) with a `handler`s object, the server will setup routes for each http method in it. When recieving a request matching one of those methods, the server will generate the response using the `handlers` matching method instead of `getStaticData`/`getDynamicData`. This response will be stored in a session (using a persistance provider that can be passed to the configuration, defaulting on file system). The server answers with a `303` redirection to the same route and a session cookie.

The `303` redirection triggers a `GET` request. The server sees the session cookie and instead of generating the response (dynamic page) or serving it from the cache (static page), it gets the response stored previously, delete it from storage and send it in response to the `GET` request.

That way, after a form submission (triggering a `POST` for exemple) the user recive the answer on a `GET` request. The user can refresh the page without submitting the form again.

### On demand refresh of static pages

For all static pages, the server will trigger a rerender of the page with fresh data if the page is requested with a `?force_refresh` query parameter.

The server will answer with the newly generated page, and will also cache the page (using the page persistance provider configured on frugal).

You can protect this feature if you set a `refreshKey` in the config :

```ts
import type * as frugal from 'https://deno.land/x/frugal/packages/core/mod.ts';

export const config: frugal.Config = {
    //...
    refreshKey: 'my-secret-key',
};
```

The server will not honor any _refresh request_ without a `Authorization` header with value `'Bearer my-secret-token'`.

## Static pages in the server

When it comes to static pages, the server follow this sequence :

- first, the server will handle _refresh requests_.
- if the request is not a _refresh request_, the server will try to handle it as a POST-redirect-GET request.
- if no session cookie could be found or if no page was found in the session storage, the server will try to serve the page from cache (using the persistance provider configured on frugal).
- if no page could be found in the cache, frugal will try to generate the page on the fly (and store it in the cache).

This last step means that you do not need to build all pages before running the server. Any static page that was not previously build will not be found in cache, and will be generated on the fly the first time it is requested.

## Dynamic pages in the server

When it comes to dynamic pages, the server follow this sequence :

- first, the server try to handle the request as a POST-redirect-GET request.
- if no session cookie could be found or if no page was found in the session storage, the server will generate the page.
