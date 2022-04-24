# Oak integration

Frugal is only a rendering orchestrator. By itself, furgal is only able to build a static website.

But with the `oak` integration, you can have a server that uses frugal in order to :

- render dynamic pages on demand
- refresh static pages on demand
- handle POST request with a POST-redirect-GET pattern

Oak integration rely on you providing the preact version you want via an [import map](https://deno.land/manual/linking_to_external_code/import_maps) :

```json
{
    "imports": {
        "oak": "https://deno.land/x/oak@v10.4.0/mod.ts"
    }
}
```

## Setup a server

Create a file `/serve.ts` :

```ts
import { config } from './frugal.config.ts';
import { Frugal } from 'https://deno.land/x/frugal/packages/core/mod.ts';
import { frugalMiddleware } from 'https://deno.land/x/frugal/packages/frugal_oak/mod.ts';

const frugal = await Frugal.load(config);

const application = new Application();

application.use(await frugalMiddleware(frugal));

await application.listen({ port: 8000 });
```

the async `frugalMiddleware` function gives you an oak-compatible `Middleware`. This middleware will handle everything related to frugal :

- serving static pages (using the page persistance provider you defined in frugal config)
- serving dynamic pages
- serving static assets (like css and js files)

You are free to add any routes you want to the oak `Application`, but be cautious not to shadow any routes that `frugalMiddleware` might already handle.

## Features

### POST-redirect-GET pattern

For page descriptor with a `postDynamicData` function, the server will setup a `POST` routes. When recieving a `POST` request, the server will generate the response using the `postDynamicData` instead of `getStaticData/getDynamicData`. This response will be stored in a session (using a persistance provider that can be passed in `frugalMiddleware`, defaulting on file system). The server answers with a `307` redirection and a session cookie.

The `GET` handler is triggered by the redirection. The server get the session cookie, get the response stored previously (and delete it from storage), and send it in response to the `GET` request.

That way, after a form submission, the user recive the answer on a `GET` request. The user can refresh the page without submitting the form again.

### On demand refresh os static pages

For all static pages, the server will trigger a rerender of the page with fresh data if the page is request with a `?force_refresh` query parameter.

The server will answer with the newly generated page, and will also cache the page (using the persistance provider configured on frugal).

You can restrict this feature if you pass a `refreshKey` to `furglaMiddleware` :

```ts
const frugal = await Frugal.load(config);

const application = new Application();

application.use(
    await frugalMiddleware(frugal, { resfreshKey: 'my-secret-key' }),
);
```

The server will not honor any _refresh request_ without a `Authorization` header with `'Bearer my-secret-token'`.

## Static pages in the server

the `frugalMiddleware` chain multiple middlewares when it comes to static pages :

- first, the server will handle _refresh requests_
- if the request is not a _refresh request_, the server will try to handle it as a POST-redirect-GET request
- if no session cookie could be found or if no page was found in the session storage, the server will try to serve the page from cache (using the persistance provider configured on frugal).
- if no page could be found in the cache, frugal will try to generate the page (and store it in the cache).

This means that you do not need to build all pages before running the server. Any static page that was not previously build will not be found in cache, and will be generated on the fly the first time it is requested.

## Dynamic pages in the server

the `frugalMiddleware` chain two middleware when it comes to dynamic pages :

- first, the server try to handle the request as a POST-redirect-GET.
- if no session cookie could be found or if no page was found in the session storage, the server will generate the page
