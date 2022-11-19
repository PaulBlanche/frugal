## Server middleware

Frugal allows you to register custom middleware (with an api somewhat similar to [`Oak`](https://oakserver.github.io/oak/)). Instead of calling the `serve` method, you need to build a frugal instance :

```ts
import {
    FrugalContext,
    FrugalServerBuilder,
    Next,
} from 'https://deno.land/x/frugal/server.ts';

const builder = new FrugalServerBuilder(config);
const instance = await builder.load();

instance.use(async (context: FrugalContext, next: Next<FrugalContext>) => {
    // do something before other middlewares

    const response = await next(context);

    // do something after other middlewares

    return response;
});
```

## Session

Frugal will create a session for each visitor, tracked with a jwt token inside a cookie.
You can have access to the session on `context.session`. Frugal handles everything regarding the session cookie and token :

- If frugal receive a fresh and valid token in the cookie, frugal will refresh the token (keep the same data, delay the expiration)
- If frugal receive a stale or invalid token, frugal will issue a new token.

By default the session contains a secret string (the same for the lifetime of the session) that can be used to generate unique tokens for the user. For example this secret is used by the CSRF protection middleware.

There is two way to store data in the session. Either store data directly in the token, or in a persistance layer associated with the session :

- `session.set`, `session.get`, `session.has` and `session.unset` works directly on the token. Data stored with these methods will be stored in a cookie
- `session.write`, `session.read` and `session.delete` works with the persistance layer. Data will be stored through the configured `sessionPersistence` persistance layer

[warn]> Don't store on the token large data. The token is stored in a cookie, and most browser have a limit of 4ko. Additionally, the data inside the token is not encrypted. This means you should not store any private data on the token.

## Sharing data with pages

The context passed to the middleware have a extra `context.state` property you can use to store any data you want. This object will be passed to the dynamic data fetching methods of your [page descriptor](/docs/api/01-page-descriptor) (`getDynamicData` and `handlers`).

This state object is the appropriate place to put information that should be accessible to the view, like authentication information. For example, the CSRF protection middleware uses this object to pass the generated token to the view.

[warn]> The `context.state` object is shared by all middlewares, be wary of name collisions!
